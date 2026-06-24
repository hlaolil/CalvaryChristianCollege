const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('Auth controller loaded:', authController ? 'OK' : 'FAILED'); // Temp debug

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Register routes
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Logout
router.get('/logout', authController.logout);

// Forgot password
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);

// Reset password
router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password/:token', authController.postResetPassword);

module.exports = router;