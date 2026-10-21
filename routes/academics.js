const express = require('express');
const router = express.Router();

// GET /academics (program overview; curriculum details live in the view)
router.get('/', (req, res) => {
  res.render('academics', { title: 'Academics' });
});

module.exports = router;
