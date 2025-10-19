const express = require('express');
const router = express.Router();
const db = require('../../db/connect');

// GET /api/academics (list)
router.get('/', async (req, res) => {
  try {
    const academics = await db.getDb().collection('academics').find().toArray();
    res.json(academics);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/academics (create)
router.post('/', async (req, res) => {
  try {
    const result = await db.getDb().collection('academics').insertOne(req.body);
    res.json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// TODO: Add PUT /:id and DELETE /:id

module.exports = router;