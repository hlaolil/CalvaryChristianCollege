// HomeController.js

exports.getHome = (req, res) => {
  // Get user from session — same as /apply, /student-portal, etc.
  const user = req.session?.user || null;

  // Optional: Normalize role (just in case)
  if (user?.role) {
    const role = user.role.toString().trim().toLowerCase();
    if (['admin', 'administrator'].includes(role)) user.role = 'admin';
    if (role.includes('applicant')) user.role = 'applicant';
    if (role.includes('alumni')) user.role = 'alumni';
    if (role.includes('student')) user.role = 'student';
  }

  // Render with user — THIS IS THE MISSING PIECE
  res.render('index', {
    title: 'Home',
    user: user  // ← NOW EJS sees the logged-in admin!
  });
};

exports.getAbout = (req, res) => {
  const user = req.session?.user || null;
  res.render('about', { title: 'About Us', user });
};
