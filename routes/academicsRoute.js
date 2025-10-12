const express = require('express');
const router = express.Router();
const academicsController = require('../controllers/academicsController');

router.get('/', academicsController.listCourses);
router.get('/add', academicsController.addCourseForm);
router.post('/add', academicsController.addCourse);

module.exports = router;
