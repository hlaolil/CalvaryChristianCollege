const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimit');

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', loginLimiter, authController.postLogin);

// Register routes
router.get('/register', authController.getRegister);
router.post('/register', registerLimiter, authController.postRegister);

// Logout (POST so other sites can't log users out with a link or image)
router.post('/logout', authController.logout);

// Forgot password
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', passwordResetLimiter, authController.postForgotPassword);

// Reset password
router.get('/reset-password/:token', authController.getResetPassword);
router.post('/reset-password/:token', passwordResetLimiter, authController.postResetPassword);

module.exports = router;
