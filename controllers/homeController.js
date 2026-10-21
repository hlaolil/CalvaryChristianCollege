// controllers/homeController.js
// `user` and `path` come from res.locals (set in app.js)

exports.getHome = (req, res) => {
  res.render('index', { title: 'Home' });
};

exports.getAbout = (req, res) => {
  res.render('about', { title: 'About Us' });
};
