exports.getContact = (req, res) => {
  res.render('contact/index', { title: 'Contact Us' });
};

exports.sendContact = (req, res) => {
  // In real use, send email or save to DB
  console.log('Contact form submitted:', req.body);
  res.redirect('/contact');
};
