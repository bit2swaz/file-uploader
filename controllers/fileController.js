const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs').promises;
const prisma = new PrismaClient();

const getFiles = async (req, res) => {
    try {
        const files = await prisma.file.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.render('dashboard', { files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).render('error', { error: 'Error fetching files' });
    }
};

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).render('dashboard', {
                error: 'No file uploaded',
                files: await prisma.file.findMany({ where: { userId: req.user.id } })
            });
        }

        const file = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
                userId: req.user.id
            }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).render('error', { error: 'Error uploading file' });
    }
};

const downloadFile = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({
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

const deleteFile = async (req, res) => {
    try {
        const file = await prisma.file.findUnique({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!file) {
            return res.status(404).render('error', { error: 'File not found' });
        }

        // Delete file from filesystem
        await fs.unlink(file.path);

        // Delete file record from database
        await prisma.file.delete({
            where: {
                id: file.id
            }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).render('error', { error: 'Error deleting file' });
    }
};

module.exports = {
    getFiles,
    uploadFile,
    downloadFile,
    deleteFile
}; 