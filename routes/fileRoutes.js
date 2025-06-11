const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const fileController = require('../controllers/fileController');
const folderController = require('../controllers/folderController');

// File routes
router.get('/dashboard', isAuthenticated, fileController.getFiles);
router.post('/upload', isAuthenticated, fileController.uploadFile);
router.get('/download/:id', isAuthenticated, fileController.downloadFile);
router.post('/delete/:id', isAuthenticated, fileController.deleteFile);

// Folder routes
router.post('/folders', isAuthenticated, folderController.createFolder);
router.post('/folders/:id/delete', isAuthenticated, folderController.deleteFolder);

module.exports = router; 