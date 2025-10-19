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

module.exports = router;