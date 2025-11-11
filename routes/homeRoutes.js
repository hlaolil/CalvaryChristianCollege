// routes/homeRoutes.js
const express = require('express');
const router = express.Router();

// Home Page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    path: req.path
  });
});

// About Page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    path: req.path
  });
});

module.exports = router;
