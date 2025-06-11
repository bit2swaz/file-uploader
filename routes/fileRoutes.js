const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const folderController = require('../controllers/folderController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// File routes
router.get('/dashboard', isAuthenticated, fileController.getFiles);
router.post('/upload', isAuthenticated, upload.single('file'), fileController.uploadFile);
router.get('/download/:id', isAuthenticated, fileController.downloadFile);
router.post('/delete/:id', isAuthenticated, fileController.deleteFile);

// Folder routes
router.post('/folders', isAuthenticated, folderController.createFolder);
router.post('/folders/:id/delete', isAuthenticated, folderController.deleteFolder);

module.exports = router; 