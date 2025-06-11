const { PrismaClient } = require('@prisma/client');
const { generateShareToken, verifyShareToken } = require('../utils/jwt');
const fs = require('fs');
const prisma = new PrismaClient();

/**
 * Render share folder form
 */
exports.showShareForm = async (req, res) => {
    try {
        const folderId = req.params.id;
        
        // Verify folder exists and belongs to user
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            }
        });
        
        if (!folder) {
            return res.status(404).render('error', { error: 'Folder not found' });
        }
        
        res.render('shareFolder', { 
            folder, 
            expiryOptions: [
                { value: '1h', label: '1 Hour' },
                { value: '6h', label: '6 Hours' },
                { value: '24h', label: '1 Day' },
                { value: '7d', label: '1 Week' },
                { value: '30d', label: '30 Days' }
            ]
        });
    } catch (error) {
        console.error('Error showing share form:', error);
        res.status(500).render('error', { error: 'Error preparing share form' });
    }
};

/**
 * Generate share link
 */
exports.generateShareLink = async (req, res) => {
    try {
        const { folderId, expiry } = req.body;
        
        // Verify folder exists and belongs to user
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id
            }
        });
        
        if (!folder) {
            return res.status(404).render('error', { error: 'Folder not found' });
        }
        
        // Generate token
        const token = generateShareToken(folderId, expiry);
        
        // Generate full URL
        const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;
        
        res.render('shareLink', { 
            folder, 
            shareUrl,
            expiry
        });
    } catch (error) {
        console.error('Error generating share link:', error);
        res.status(500).render('error', { error: 'Error generating share link' });
    }
};

/**
 * Access shared folder via token
 */
exports.accessSharedFolder = async (req, res) => {
    try {
        const token = req.params.token;
        
        // Verify token
        const payload = verifyShareToken(token);
        
        if (!payload) {
            return res.render('sharedFolderExpired');
        }
        
        const { folderId } = payload;
        
        // Get folder and files
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                files: {
                    orderBy: { createdAt: 'desc' }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        if (!folder) {
            return res.status(404).render('error', { error: 'Shared folder not found' });
        }
        
        res.render('sharedFolder', { 
            folder,
            isPublic: true,
            owner: folder.user,
            req: req
        });
    } catch (error) {
        console.error('Error accessing shared folder:', error);
        res.status(500).render('error', { error: 'Error accessing shared folder' });
    }
};

/**
 * Download a file from a shared folder
 */
exports.downloadSharedFile = async (req, res) => {
    try {
        const token = req.params.token;
        const fileId = req.params.fileId;
        
        // Verify token
        const payload = verifyShareToken(token);
        
        if (!payload) {
            return res.render('sharedFolderExpired');
        }
        
        const { folderId } = payload;
        
        // Verify file exists and belongs to the shared folder
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                folderId: folderId
            }
        });
        
        if (!file) {
            return res.status(404).render('error', { error: 'File not found in shared folder' });
        }
        
        // Log download
        console.log(`File ${file.id} downloaded from shared folder ${folderId}`);
        
        // Check if it's a local file
        if (file.isLocalFile || !file.url) {
            if (file.path && fs.existsSync(file.path)) {
                console.log('Serving local file from shared folder:', file.path);
                return res.download(file.path, file.filename);
            } else {
                return res.status(404).render('error', { error: 'Local file not found' });
            }
        }
        
        // If we have a Supabase URL, redirect to it
        if (file.url) {
            console.log('Redirecting to Supabase URL for shared file:', file.url);
            return res.redirect(file.url);
        }
        
        return res.status(404).render('error', { error: 'File content not available' });
    } catch (error) {
        console.error('Error downloading shared file:', error);
        res.status(500).render('error', { error: 'Error downloading file from shared folder' });
    }
}; 