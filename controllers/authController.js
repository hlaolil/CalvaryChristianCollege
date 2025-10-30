const bcrypt = require('bcrypt');
const db = require('../db/connect');

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render('login', {
    error: null,
    title: 'Login'
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
        title: 'Login'
      });
    }

    // Set user info in session, including role (with fallback and stringify)
    req.session.user = { 
      id: user._id.toString(),  // New: Stringify ObjectId
      name: user.name, 
      email: user.email, 
      role: user.role || 'applicant'  // New: Default if missing
    };

    console.log('Login Session Set:', req.session.user);  // New: Debug log

    // New: Async save before redirect
    req.session.save(err => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.render('login', { error: 'Session error. Try again.', title: 'Login' });
      }
      res.redirect('/');  // Safe redirect
    });
  } catch (err) {
    console.error(err);
    res.render('login', {
      error: 'Server error. Please try again.',
      title: 'Login'
    });
  }
};

// GET /auth/register
exports.getRegister = (req, res) => {
  res.render('register', {
    error: null,
    title: 'Register',
    roles: ['applicant', 'student', 'alumni', 'admin']
  });
};

// POST /auth/register
exports.postRegister = async (req, res) => {
  const { name, email, password, role, adminSecret, studentNumber } = req.body;
  const validRoles = ['applicant', 'student', 'alumni', 'admin'];
  try {
    // Validate role
    if (!validRoles.includes(role)) {
      return res.render('register', {
        error: 'Invalid role selected',
        title: 'Register',
        roles: validRoles
      });
    }
    // Check for existing user
    const existingUser = await db.getDb().collection('users').findOne({ email });
    if (existingUser) {
      return res.render('register', {
        error: 'Email already registered',
        title: 'Register',
        roles: validRoles
      });
    }
    // Validate admin role with secret key
    if (role === 'admin' && adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.render('register', {
        error: 'Invalid admin secret key',
        title: 'Register',
        roles: validRoles
      });
    }
    // Validate student role with student number
    if (role === 'student') {
      if (!studentNumber || !/^[A-Z0-9]{8,12}$/.test(studentNumber)) {
        return res.render('register', {
          error: 'Invalid student number (must be 8-12 alphanumeric characters)',
          title: 'Register',
          roles: validRoles
        });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role  // Ensure role is always saved
    };
    // Add studentNumber to user document for students
    if (role === 'student') {
      userData.studentNumber = studentNumber;
    }
    const result = await db.getDb().collection('users').insertOne(userData);
    
    // Auto-login after successful registration
    req.session.user = { 
      id: result.insertedId.toString(),  // New: Stringify insertedId
      name, 
      email, 
      role 
    };

    console.log('Register Session Set:', req.session.user);  // New: Debug log

    // New: Async save before redirect
    req.session.save(err => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.render('register', { error: 'Session error. Try again.', title: 'Register', roles: validRoles });
      }
      res.redirect('/');  // Safe redirect
    });
  } catch (err) {
    console.error(err);
    res.render('register', {
      error: 'Server error. Please try again.',
      title: 'Register',
      roles: validRoles
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
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
};
