const express = require('express');
const router = express.Router();

// GET / (home)
router.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// GET /about (stub for missing route)
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

module.exports = router;