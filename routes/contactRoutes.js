const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimit');

// GET /contact
router.get('/', contactController.getContact);

// POST /contact
router.post('/', contactLimiter, contactController.sendContact);

module.exports = router;
