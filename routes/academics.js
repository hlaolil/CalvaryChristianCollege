const express = require('express');
const router = express.Router();

// GET /academics (dashboard/list)
router.get('/', (req, res) => {
  const academics = [
    { title: 'Level 1 Certificate in Christian Discipleship' },
    { title: 'Level 2 Diploma in Christian Leadership' },
    { title: 'Level 3 Advanced Diploma in Ministry' },
    { title: 'Level 2 Certificate in Theology' },
    { title: 'Level 3 Diploma in Theology' },
    { title: 'Level 2 Certificate in Biblical Studies' },
    { title: 'Level 3 Diploma in Biblical Studies' },
    { title: 'Level 3 Diploma in Business Leadership' },
    { title: 'Level 4 Higher Diploma in Shepherding' },
    { title: 'Level 5 Bachelor of Ministry' }
  ];
  res.render('academics', { 
    title: 'Academics Dashboard',
    academics
  });
});

module.exports = router;