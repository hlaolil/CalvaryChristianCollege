const bcrypt = require('bcrypt');
const db = require('../db/connect');

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render('login', { 
    error: null,
    title: 'Login',
    user: req.session?.user || null
  });
};

// POST /auth/login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.getDb().collection('users').findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { 
        error: 'Invalid email or password',
        title: 'Login',
        user: req.session?.user || null
      });
    }

    // Save user info in session
    req.session.user = { id: user._id, name: user.name, email: user.email };
    res.redirect('/'); // redirect to home/dashboard after login
  } catch (err) {
    console.error(err);
    res.render('login', { 
      error: 'Server error. Please try again.',
      title: 'Login',
      user: req.session?.user || null
    });
  }
};

// GET /auth/register
exports.getRegister = (req, res) => {
  res.render('register', { 
    error: null,
    title: 'Register',
    user: req.session?.user || null
  });
};

// POST /auth/register
exports.postRegister = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await db.getDb().collection('users').findOne({ email });
    if (existingUser) {
      return res.render('register', { 
        error: 'Email already registered',
        title: 'Register',
        user: req.session?.user || null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.getDb().collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
    });

    // Redirect to login page after successful registration
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    res.render('register', { 
      error: 'Server error. Please try again.',
      title: 'Register',
      user: req.session?.user || null
    });
  }
};

// GET /auth/logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.redirect('/');
    }
    res.clearCookie('connect.sid'); // optional: clear session cookie
    res.redirect('/auth/login');
  });
};
