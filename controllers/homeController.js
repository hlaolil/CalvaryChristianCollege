exports.getHome = (req, res) => {
  res.render('index', { title: 'Home' });
};

exports.getAbout = (req, res) => {
  res.render('about', { title: 'About Us' });
};
