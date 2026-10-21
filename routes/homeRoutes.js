// routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home Page
router.get('/', homeController.getHome);

// About Page
router.get('/about', homeController.getAbout);

module.exports = router;
