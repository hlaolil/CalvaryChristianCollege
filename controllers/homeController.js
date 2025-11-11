// HomeController.js
const db = require('../db/connect');
exports.getHome = (req, res) => {
  const user = req.session?.user || null;  // ← ADD THIS

  res.render('index', {
    title: 'Home',
    user: user  // ← AND THIS
  });
};

exports.getAbout = (req, res) => {
  const user = req.session?.user || null;
  res.render('about', { title: 'About Us', user });
};
