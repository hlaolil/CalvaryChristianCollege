const express = require('express');
const router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Home', 
    user: req.user,
    path: req.path  // <-- ADD THIS
  });
});

// About
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us', 
    user: req.user,
    path: req.path  // <-- ADD THIS
  });
});

module.exports = router;
