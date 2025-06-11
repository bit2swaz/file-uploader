const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFolders = async (req, res) => {
    try {
        const folders = await prisma.folder.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                _count: {
                    select: { files: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(folders);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: 'Error fetching folders' });
    }
};

const createFolder = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).render('dashboard', {
                error: 'Folder name is required',
                files: await prisma.file.findMany({
                    where: { userId: req.user.id },
                    include: { folder: true }
                }),
                folders: await prisma.folder.findMany({
                    where: { userId: req.user.id },
                    orderBy: { name: 'asc' }
                })
            });
        }

        const folder = await prisma.folder.create({
            data: {
                name,
                userId: req.user.id
            }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).render('error', { error: 'Error creating folder' });
    }
};

const updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Check if folder exists and belongs to user
        const existingFolder = await prisma.folder.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (!existingFolder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Check if new name conflicts with another folder
        const nameConflict = await prisma.folder.findFirst({
            where: {
                name,
                userId: req.user.id,
                id: { not: id }
            }
        });

        if (nameConflict) {
            return res.status(400).json({ error: 'Folder with this name already exists' });
        }

        const folder = await prisma.folder.update({
            where: { id },
            data: { name }
        });

        res.json(folder);
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Error updating folder' });
    }
};

const deleteFolder = async (req, res) => {
    try {
        const folder = await prisma.folder.findUnique({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                files: true
            }
        });

        if (!folder) {
            return res.status(404).render('error', { error: 'Folder not found' });
        }

        // Move all files in the folder to "No Folder"
        await prisma.file.updateMany({
            where: {
                folderId: folder.id
            },
            data: {
                folderId: null
            }
        });

        // Delete the folder
        await prisma.folder.delete({
            where: {
                id: folder.id
            }
        });

        res.redirect('/files/dashboard');
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).render('error', { error: 'Error deleting folder' });
    }
};

module.exports = {
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder
}; 