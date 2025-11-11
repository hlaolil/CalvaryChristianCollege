// HomeController.js

exports.getHome = (req, res) => {
  // Get user from session (same as other pages)
  const user = req.session?.user || null;

  // Optional: Normalize role to avoid case/spelling issues
  if (user && user.role) {
    const role = user.role.toString().trim().toLowerCase();
    if (['admin', 'administrator'].includes(role)) user.role = 'admin';
    if (role.includes('applicant')) user.role = 'applicant';
    if (role.includes('alumni')) user.role = 'alumni';
    if (role.includes('student')) user.role = 'student';
  }

  // Render with user
  res.render('index', {
    title: 'Home',
    user: user  // This is what your EJS template needs
  });
};

exports.getAbout = (req, res) => {
  const user = req.session?.user || null;
  res.render('about', {
    title: 'About Us',
    user: user
  });
};
