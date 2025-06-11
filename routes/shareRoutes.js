const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const shareController = require('../controllers/shareController');

// Protected routes (require authentication)
router.get('/folder/:id', isAuthenticated, shareController.showShareForm);
router.post('/generate', isAuthenticated, shareController.generateShareLink);

// Public routes (no authentication required)
router.get('/:token', shareController.accessSharedFolder);
router.get('/:token/download/:fileId', shareController.downloadSharedFile);

module.exports = router; 