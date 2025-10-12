const { getAllCourses, addCourse } = require('../models/academicsModel');

exports.listCourses = async (req, res) => {
  const courses = await getAllCourses();
  res.render('academics/list', { title: 'Academics', courses });
};

exports.addCourseForm = (req, res) => {
  res.render('academics/add', { title: 'Add Course' });
};

exports.addCourse = async (req, res) => {
  await addCourse(req.body);
  res.redirect('/academics');
};
