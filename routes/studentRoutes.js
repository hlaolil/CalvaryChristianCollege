// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { ensureAuth } = require('../middleware/auth');

router.get('/', ensureAuth, studentController.getStudentPortal);

module.exports = router;
