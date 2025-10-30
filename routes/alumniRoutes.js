const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');

// GET /alumni
router.get('/', alumniController.getAlumni);

// POST /alumni
router.post('/', alumniController.postAlumni);

module.exports = router;
