const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isNotAuthenticated } = require('../middlewares/auth');
const authController = require('../controllers/authController');

// Login routes
router.get('/login', isNotAuthenticated, authController.login);
router.post('/login', isNotAuthenticated, passport.authenticate('local', {
  failureRedirect: '/auth/login',
  failureFlash: true
}), authController.loginPost);

// Register routes
router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('auth/register', { error: null });
});
router.post('/register', isNotAuthenticated, authController.register);

// Logout route
router.get('/logout', authController.logout);

module.exports = router; 