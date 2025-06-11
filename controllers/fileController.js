const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
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

// Upload a new file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).render('error', { error: 'No file uploaded' });
        }

        const file = req.files.file;
        const folderId = req.body.folderId;

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

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(uploadsDir, uniqueFilename);

        // Move the file
        await file.mv(uploadPath);

        // Create file record in database
        const fileRecord = await prisma.file.create({
            data: {
                filename: file.name,
                path: uploadPath,
                size: file.size,
                mimetype: file.mimetype,
                userId: req.user.id,
                folderId: folderId || null
            }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).render('error', { error: 'Error uploading file' });
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

        res.download(file.path, file.filename);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).render('error', { error: 'Error downloading file' });
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

        // Delete file from filesystem
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Delete file record from database
        await prisma.file.delete({
            where: { id: file.id }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).render('error', { error: 'Error deleting file' });
    }
}; 