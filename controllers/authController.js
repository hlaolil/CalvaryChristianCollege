// authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db/connect');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { str, isValidPhone, isValidEmail, safeRedirect } = require('../utils/validate');
const { programsByLevel, isAvailableProgram } = require('../utils/programs');
const { tokensMatch } = require('../middleware/csrf');
const { homeFor, toSessionUser } = require('../middleware/auth');

const ROLES = ['applicant', 'student', 'alumni', 'admin'];
const MIN_PASSWORD_LENGTH = 8;

// Reset tokens are stored hashed, so a database leak does not expose live reset links
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Starts a fresh session for `userDoc` (prevents session fixation) and
// resolves with the page the user was trying to reach, if any.
function startSession(req, userDoc) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);
      req.session.user = toSessionUser(userDoc);
      req.session.save(saveErr => (saveErr ? reject(saveErr) : resolve(returnTo)));
    });
  });
}

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render('login', {
    error: null,
    title: 'Login',
    resetSuccess: req.query.reset === 'success',
    form: {}
  });
};

// POST /auth/login
exports.postLogin = async (req, res, next) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  const renderError = (status, error) =>
    res.status(status).render('login', { error, title: 'Login', resetSuccess: false, form: { email } });

  try {
    const user = email && password
      ? await db.getDb().collection('users').findOne({ email })
      : null;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return renderError(401, 'Invalid email or password');
    }
    const returnTo = await startSession(req, user);
    res.redirect(safeRedirect(returnTo, homeFor(user)));
  } catch (err) {
    next(err);
  }
};

function renderRegister(res, { error = null, form = {}, status = 200 } = {}) {
  res.status(status).render('register', {
    error,
    title: 'Register',
    roles: ROLES,
    programGroups: programsByLevel(),
    form
  });
}

// GET /auth/register
exports.getRegister = (req, res) => {
  const role = str(req.query.role);
  renderRegister(res, { form: { role: ROLES.includes(role) ? role : 'applicant' } });
};

// POST /auth/register
exports.postRegister = async (req, res, next) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const phoneNumber = str(req.body.phoneNumber);
  const role = str(req.body.role);
  const adminSecret = str(req.body.adminSecret);
  const studentNumber = str(req.body.studentNumber).toUpperCase();
  const programOfStudy = str(req.body.programOfStudy);

  // Echoed back into the form on errors (never the password or admin key)
  const form = { name, email, phoneNumber, role, studentNumber, programOfStudy };
  const fail = (error) => renderRegister(res, { error, form, status: 400 });

  try {
    // === 1. Required Fields for ALL users ===
    if (!name || !email || !password || !phoneNumber || !role) {
      return fail('Please fill in all required fields.');
    }
    if (!ROLES.includes(role)) {
      return fail('Invalid role selected.');
    }
    if (!isValidEmail(email)) {
      return fail('Please enter a valid email address.');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    // === 2. Phone number format (international) ===
    if (!isValidPhone(phoneNumber)) {
      return fail('Invalid phone number. Use the international format, e.g. +266 5812 3456');
    }

    // === 3. ADMIN-ONLY: Secret Key Validation ===
    if (role === 'admin') {
      const expected = process.env.ADMIN_SECRET_KEY;
      if (!expected || !tokensMatch(adminSecret, expected)) {
        return fail('Invalid admin secret key.');
      }
    }

    // === 4. STUDENT-ONLY: Student Number + Program ===
    if (role === 'student') {
      if (!/^[A-Z0-9]{6}$/.test(studentNumber)) {
        return fail('Student number must be exactly 6 letters or digits.');
      }
      if (!isAvailableProgram(programOfStudy)) {
        return fail('Please select a valid program of study.');
      }
    }

    // === 5. Email uniqueness ===
    const users = db.getDb().collection('users');
    if (await users.findOne({ email })) {
      return fail('This email is already registered.');
    }

    // === 6. Build user document ===
    const userData = {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      phoneNumber,
      role,
      createdAt: new Date()
    };
    if (role === 'student') {
      userData.studentNumber = studentNumber;
      userData.programOfStudy = programOfStudy;
    }

    // === 7. Insert (the unique index catches a simultaneous duplicate) ===
    let result;
    try {
      result = await users.insertOne(userData);
    } catch (err) {
      if (err.code === 11000) return fail('This email is already registered.');
      throw err;
    }

    // === 8. Auto-login ===
    const returnTo = await startSession(req, { ...userData, _id: result.insertedId });
    res.redirect(safeRedirect(returnTo, homeFor(userData)));
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
exports.logout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
};

// GET /auth/forgot-password
exports.getForgotPassword = (req, res) => {
  res.render('forgot-password', { error: null, success: null, title: 'Forgot Password' });
};

// POST /auth/forgot-password
exports.postForgotPassword = async (req, res, next) => {
  const email = str(req.body.email).toLowerCase();
  const render = (error, success) =>
    res.render('forgot-password', { error, success, title: 'Forgot Password' });

  if (!email) {
    return render('Please enter your email address.', null);
  }

  // Always show the same message to prevent email enumeration
  const successMsg = 'If an account with that email exists, a reset link has been sent.';

  try {
    const user = await db.getDb().collection('users').findOne({ email });
    if (!user) {
      return render(null, successMsg);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.getDb().collection('users').updateOne(
      { _id: user._id },
      { $set: { resetToken: hashToken(token), resetTokenExpiry: expiry } }
    );

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const resetLink = `${baseUrl}/auth/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (mailErr) {
      // Logged for the admin; the visitor still sees the same message so the
      // response doesn't reveal whether the account exists
      console.error('Password reset email failed:', mailErr.message);
    }

    render(null, successMsg);
  } catch (err) {
    next(err);
  }
};

async function findUserByResetToken(token) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db.getDb().collection('users').findOne({
    resetToken: hashToken(token),
    resetTokenExpiry: { $gt: new Date() },
  });
}

// GET /auth/reset-password/:token
exports.getResetPassword = async (req, res, next) => {
  const { token } = req.params;
  try {
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.render('reset-password', {
        error: 'This reset link is invalid or has expired.',
        token: null,
        title: 'Reset Password',
        minLength: MIN_PASSWORD_LENGTH
      });
    }
    res.render('reset-password', { error: null, token, title: 'Reset Password', minLength: MIN_PASSWORD_LENGTH });
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password/:token
exports.postResetPassword = async (req, res, next) => {
  const { token } = req.params;
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

  const renderError = (msg) =>
    res.status(400).render('reset-password', { error: msg, token, title: 'Reset Password', minLength: MIN_PASSWORD_LENGTH });

  if (password.length < MIN_PASSWORD_LENGTH) {
    return renderError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (password !== confirmPassword) {
    return renderError('Passwords do not match.');
  }

  try {
    const user = await findUserByResetToken(token);
    if (!user) {
      return renderError('This reset link is invalid or has expired.');
    }

    await db.getDb().collection('users').updateOne(
      { _id: user._id },
      { $set: { password: await bcrypt.hash(password, 10) }, $unset: { resetToken: '', resetTokenExpiry: '' } }
    );

    res.redirect('/auth/login?reset=success');
  } catch (err) {
    next(err);
  }
};
