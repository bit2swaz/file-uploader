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

        // Upload to Supabase
        const fileBuffer = Buffer.from(await file.data);
        const { path: storagePath, url } = await uploadToSupabase(
            fileBuffer,
            file.name,
            file.mimetype,
            req.user.id
        );

        // Create file record in database
        const fileRecord = await prisma.file.create({
            data: {
                filename: file.name,
                storagePath: storagePath,
                url: url,
                size: file.size,
                mimetype: file.mimetype,
                userId: req.user.id,
                folderId: folderId || null
            }
        });

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
        
        // If we have a Supabase URL, redirect to it
        if (file.url) {
            return res.redirect(file.url);
        } 
        
        // Fallback to local file if URL not available
        if (file.path && fs.existsSync(file.path)) {
            return res.download(file.path, file.filename);
        }
        
        return res.status(404).render('error', { error: 'File content not available' });
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

        // Delete from Supabase if storagePath exists
        if (file.storagePath) {
            await deleteFromSupabase(file.storagePath);
        }

        // Delete local file if path exists
        if (file.path && fs.existsSync(file.path)) {
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