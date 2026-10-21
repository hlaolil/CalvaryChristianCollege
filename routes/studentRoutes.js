// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// ensureAuth is applied in app.js
router.get('/', studentController.getStudentPortal);

module.exports = router;
