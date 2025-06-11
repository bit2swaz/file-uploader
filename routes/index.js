const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('index', { 
      title: 'File Uploader',
      user: req.user
    });
  } else {
    res.redirect('/auth/login');
  }
});

module.exports = router; 