exports.getHome = (req, res) => {
  res.render('home/index', { title: 'Home' });
};

exports.getAbout = (req, res) => {
  res.render('home/about', { title: 'About Us' });
};
