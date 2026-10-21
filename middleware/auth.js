const { ObjectId } = require('mongodb');
const db = require('../db/connect');

// Fields of the user document that views and controllers may use
const USER_PROJECTION = {
  name: 1, email: 1, role: 1, phoneNumber: 1, studentNumber: 1, programOfStudy: 1, createdAt: 1
};

function toSessionUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    phoneNumber: doc.phoneNumber || null,
    studentNumber: doc.studentNumber || null,
    programOfStudy: doc.programOfStudy || null,
    createdAt: doc.createdAt || null
  };
}

// Refreshes req.session.user from the database on every request, so a role change
// (e.g. an applicant approved as a student) or a deleted account takes effect at once.
exports.loadUser = async (req, res, next) => {
  const sessionUser = req.session?.user;
  if (sessionUser) {
    try {
      const doc = ObjectId.isValid(sessionUser.id)
        ? await db.getDb().collection('users').findOne(
          { _id: new ObjectId(sessionUser.id) },
          { projection: USER_PROJECTION }
        )
        : null;
      req.session.user = doc ? toSessionUser(doc) : undefined;
    } catch (err) {
      return next(err);
    }
  }
  res.locals.user = req.session?.user || null;
  res.locals.homeHref = exports.homeFor(res.locals.user);
  next();
};

exports.ensureAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.method === 'GET') req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

exports.ensureAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'You do not have permission to do that.'
    });
  }
  next();
};

// Where each role lands after logging in, and what "Go to Dashboard" links to
exports.homeFor = (user) => {
  switch (user?.role) {
    case 'applicant': return '/apply';
    case 'alumni': return '/alumni';
    case 'student': return '/student-portal';
    case 'admin': return '/apply';
    default: return '/';
  }
};

exports.toSessionUser = toSessionUser;
