const express = require('express');
const router = express.Router();

// GET /academics (dashboard/list)
router.get('/', (req, res) => {
  // TODO: Fetch academics from DB
  res.render('academics', { 
    title: 'Academics Dashboard',
    academics: [] // Placeholder
  });
});

// GET /academics/add
router.get('/add', (req, res) => {
  res.render('addAcademic', { title: 'Add Academic' });
});

// POST /academics/add
router.post('/add', async (req, res) => {
  // TODO: Insert to DB
  res.redirect('/academics');
});

module.exports = router;