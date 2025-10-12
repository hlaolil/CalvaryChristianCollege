const { getAllCourses, addCourse } = require('../models/academicsModel');

// List all courses
exports.listCourses = async (req, res) => {
  const courses = await getAllCourses();
  res.render('academics/list', { title: 'Academics', courses });
};

// Render add course form
exports.addCourseForm = (req, res) => {
  res.render('academics/add', { title: 'Add Course' });
};

// Handle add course POST
exports.addCourse = async (req, res) => {
  await addCourse(req.body);
  res.redirect('/academics');
};

exports.dashboard = (req, res) => {
  res.render('academics/dashboard', { title: 'Academics Dashboard' });
};
