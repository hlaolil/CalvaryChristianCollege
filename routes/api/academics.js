const express = require('express');
const router = express.Router();
const { getDb } = require('../../db/connect');
const { ObjectId } = require('mongodb');

// GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await getDb().collection('academics').find().toArray();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET course by id
router.get('/:id', async (req, res) => {
  try {
    const course = await getDb()
      .collection('academics')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!course) return res.status(404).json({ message: 'Not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new course
router.post('/', async (req, res) => {
  try {
    const result = await getDb().collection('academics').insertOne(req.body);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update course
router.put('/:id', async (req, res) => {
  try {
    const result = await getDb()
      .collection('academics')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE course
router.delete('/:id', async (req, res) => {
  try {
    const result = await getDb()
      .collection('academics')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
