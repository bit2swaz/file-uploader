const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { uploadFile: uploadToSupabase, deleteFile: deleteFromSupabase } = require('../config/supabase');
const prisma = new PrismaClient();

// Get all files for a user
exports.getFiles = async (req, res) => {
    try {
        const folders = await prisma.folder.findMany({
            where: { userId: req.user.id },
            include: {
                files: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        res.render('dashboard', { folders });
    } catch (error) {
        console.error('Error getting files:', error);
        res.status(500).render('error', { error: 'Error getting files' });
    }
};

// Get file details
exports.getFileDetail = async (req, res) => {
    try {
        const file = await prisma.file.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                folder: true
            }
        });

        if (!file) {
            return res.status(404).render('error', { error: 'File not found' });
        }

        res.render('fileDetail', { file });
    } catch (error) {
        console.error('Error getting file details:', error);
        res.status(500).render('error', { error: 'Error getting file details' });
    }
};

// Upload a new file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).render('error', { error: 'No file uploaded' });
        }

        const file = req.files.file;
        const folderId = req.body.folderId;

        console.log('File received:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
        });

        // Validate folder ownership
        if (folderId) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    userId: req.user.id
                }
            });
            if (!folder) {
                return res.status(403).render('error', { error: 'Invalid folder' });
            }
        }

        // Create a temporary local file first (workaround for express-fileupload)
        const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
        
        // Move uploaded file to temp location
        await file.mv(tempFilePath);
        
        // Read the file as a buffer
        const fileBuffer = fs.readFileSync(tempFilePath);
        
        console.log('File saved to temp location, size:', fileBuffer.length);

        // Upload to Supabase (with fallback to local storage)
        const result = await uploadToSupabase(
            fileBuffer,
            file.name,
            file.mimetype,
            req.user.id
        );
        
        console.log('Upload result:', result);
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        // Create file record in database
        const fileData = {
            filename: file.name,
            size: file.size,
            mimetype: file.mimetype,
            userId: req.user.id,
            folderId: folderId || null,
            isLocalFile: result.isLocal || false
        };
        
        // Add storage details based on result type (cloud or local)
        if (result.path) {
            fileData.storagePath = result.path;
        }
        
        if (result.url) {
            fileData.url = result.url;
        }
        
        if (result.localPath) {
            fileData.path = result.localPath;
        }
        
        const fileRecord = await prisma.file.create({ data: fileData });
        
        console.log('File record created in database with ID:', fileRecord.id);

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).render('error', { error: 'Error uploading file: ' + error.message });
    }
};

// Download a file
exports.downloadFile = async (req, res) => {
    try {
        const file = await prisma.file.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!file) {
            return res.status(404).render('error', { error: 'File not found' });
        }

        // Log download attempt
        console.log(`User ${req.user.id} is downloading file ${file.id}: ${file.filename}`);
        
        // Check if it's a local file first
        if (file.isLocalFile || !file.url) {
            if (file.path && fs.existsSync(file.path)) {
                console.log('Serving local file:', file.path);
                return res.download(file.path, file.filename);
            } else {
                return res.status(404).render('error', { error: 'Local file not found' });
            }
        }
        
        // If we have a Supabase URL, check if it's accessible before redirecting
        if (file.url) {
            try {
                // Test if the URL is accessible
                const response = await fetch(file.url, { method: 'HEAD' });
                
                if (response.ok) {
                    console.log('Redirecting to Supabase URL:', file.url);
                    return res.redirect(file.url);
                } else {
                    console.error('Supabase URL is not accessible:', response.status, response.statusText);
                    
                    // If we have a local backup, use that
                    if (file.path && fs.existsSync(file.path)) {
                        console.log('Falling back to local file:', file.path);
                        return res.download(file.path, file.filename);
                    }
                    
                    return res.status(404).render('error', { error: 'File not accessible in cloud storage' });
                }
            } catch (error) {
                console.error('Error checking Supabase URL:', error);
                
                // If we have a local backup, use that
                if (file.path && fs.existsSync(file.path)) {
                    console.log('Falling back to local file after URL check error:', file.path);
                    return res.download(file.path, file.filename);
                }
                
                return res.status(500).render('error', { error: 'Error accessing file in cloud storage' });
            }
        }
        
        return res.status(404).render('error', { error: 'File content not available' });
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).render('error', { error: 'Error downloading file: ' + error.message });
    }
};

// Delete a file
exports.deleteFile = async (req, res) => {
    try {
        const file = await prisma.file.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!file) {
            return res.status(404).render('error', { error: 'File not found' });
        }

        // Delete from Supabase if storagePath exists
        if (file.storagePath) {
            try {
                await deleteFromSupabase(file.storagePath);
                console.log('File deleted from Supabase:', file.storagePath);
            } catch (error) {
                console.error('Error deleting from Supabase, continuing anyway:', error);
            }
        }

        // Delete local file if path exists
        if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log('Local file deleted:', file.path);
        }

        // Delete file record from database
        await prisma.file.delete({
            where: { id: file.id }
        });
        
        console.log('File record deleted from database:', file.id);

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).render('error', { error: 'Error deleting file' });
    }
}; 