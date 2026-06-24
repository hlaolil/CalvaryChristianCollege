exports.ensureAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

exports.ensureAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('404', { title: 'Access Denied' });
  }
  next();
};
