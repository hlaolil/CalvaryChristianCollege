const express = require('express');
const router = express.Router();
const applyController = require('../controllers/applyController');

// GET /apply
router.get('/', applyController.getApply);

// POST /apply
router.post('/', applyController.postApply);

module.exports = router;