const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// GET /contact
router.get('/', contactController.getContact);

// POST /contact
router.post('/', contactController.sendContact);

module.exports = router;