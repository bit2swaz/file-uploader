const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const folderController = require('../controllers/folderController');

// Folder routes
router.get('/', isAuthenticated, folderController.getFolders);
router.post('/', isAuthenticated, folderController.createFolder);
router.put('/:id', isAuthenticated, folderController.updateFolder);
router.delete('/:id', isAuthenticated, folderController.deleteFolder);

module.exports = router; 