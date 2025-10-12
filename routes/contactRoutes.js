const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', contactController.getContact);
router.post('/', contactController.sendContact);

module.exports = router;
