const express = require('express');
const router = express.Router();
const applyController = require('../controllers/applyController');
const { ensureAdmin } = require('../middleware/auth');

// GET /apply
router.get('/', applyController.getApply);

// POST /apply
router.post('/', applyController.postApply);

// POST /apply/:id/status  — admin only
router.post('/:id/status', ensureAdmin, applyController.updateApplicationStatus);

module.exports = router;
