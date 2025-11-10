// authController.js
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
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.redirect('/');
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
  const {
    name,
    email,
    password,
    phoneNumber,
    role,
    adminSecret,        // <-- only used for admin
    studentNumber,
    programOfStudy
  } = req.body;

  const validRoles = ['applicant', 'student', 'alumni', 'admin'];
  const validPrograms = [
  "Level 1 Certificate in Christian Discipleship",
  "Level 2 Diploma in Christian Leadership",
  "Level 3 Advanced Diploma in Ministry",
  "Level 4 Higher Diploma in Shepherding",
  "Level 5 Bachelor of Ministry"
];

  try {
    // === 1. Required Fields for ALL users ===
    if (!name?.trim() || !email?.trim() || !password || !phoneNumber?.trim() || !role) {
      return res.render('register', {
        error: 'Please fill in all required fields.',
        title: 'Register',
        roles: validRoles
      });
    }

    if (!validRoles.includes(role)) {
      return res.render('register', {
        error: 'Invalid role selected.',
        title: 'Register',
        roles: validRoles
      });
    }

    // === 2. Email uniqueness ===
    const existingUser = await db.getDb()
      .collection('users')
      .findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.render('register', {
        error: 'This email is already registered.',
        title: 'Register',
        roles: validRoles
      });
    }

    // === 3. Phone number format (international) ===
    const phoneRegex = /^\+\d{1,3}\s?\d{4,14}$/; // +266 58123456
    if (!phoneRegex.test(phoneNumber.trim())) {
      return res.render('register', {
        error: 'Invalid phone number. Use format: +266 1234 5678',
        title: 'Register',
        roles: validRoles
      });
    }

    // === 4. ADMIN-ONLY: Secret Key Validation ===
    if (role === 'admin') {
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return res.render('register', {
          error: 'Invalid admin secret key.',
          title: 'Register',
          roles: validRoles
        });
      }
    }
    // For non-admins: adminSecret is ignored completely

    // === 5. STUDENT-ONLY: Student Number + Program ===
    if (role === 'student') {
      if (!studentNumber || !/^[A-Z0-9]{6}$/.test(studentNumber)) {
        return res.render('register', {
          error: 'Student number must be exactly 6 alphanumeric characters.',
          title: 'Register',
          roles: validRoles
        });
      }
      if (!programOfStudy || !validPrograms.includes(programOfStudy)) {
        return res.render('register', {
          error: 'Please select a valid program of study.',
          title: 'Register',
          roles: validRoles
        });
      }
    }

    // === 6. Hash password ===
    const hashedPassword = await bcrypt.hash(password, 10);

    // === 7. Build user document ===
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phoneNumber: phoneNumber.trim(),
      role,
      createdAt: new Date()
    };

    if (role === 'student') {
      userData.studentNumber = studentNumber.toUpperCase();
      userData.programOfStudy = programOfStudy;
    }

    // === 8. Insert into DB ===
    const result = await db.getDb().collection('users').insertOne(userData);

    // === 9. Auto-login ===
    req.session.user = {
      id: result.insertedId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phoneNumber: userData.phoneNumber,
      studentNumber: userData.studentNumber || null,        // ← NEW
      programOfStudy: userData.programOfStudy || null      // ← NEW
    }
    res.redirect('/');

  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      error: 'Server error. Please try again later.',
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
