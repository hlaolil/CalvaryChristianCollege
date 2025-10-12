const express = require('express');
const router = express.Router();
const { dashboard, listCourses, addCourseForm, addCourse } = require('../controllers/academicsController');

// Dashboard page
router.get('/', dashboard);

// List courses page
router.get('/list', listCourses);

// Add course page
router.get('/add', addCourseForm);
router.post('/add', addCourse);

module.exports = router;
