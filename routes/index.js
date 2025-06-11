const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/files/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

module.exports = router; 