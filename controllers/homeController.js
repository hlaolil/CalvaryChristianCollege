// HomeController.js
const db = require('../db/connect');

exports.getHome = (req, res) => {
  // No need to pass user — it's in res.locals.user
  res.render('index', { title: 'Home' });
};

exports.getAbout = (req, res) => {
  res.render('about', { title: 'About Us' });
};
