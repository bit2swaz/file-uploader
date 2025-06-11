const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middlewares/auth');
const fileController = require('../controllers/fileController');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// File routes
router.get('/dashboard', isAuthenticated, fileController.getFiles);
router.post('/upload', isAuthenticated, upload.single('file'), fileController.uploadFile);
router.get('/download/:id', isAuthenticated, fileController.downloadFile);
router.post('/delete/:id', isAuthenticated, fileController.deleteFile);

module.exports = router; 