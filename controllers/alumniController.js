// controllers/alumniController.js
const db = require('../db/connect');
const { pickFields, missingFields, isValidPhone } = require('../utils/validate');
const { paginate, emptyPage } = require('../utils/pagination');

const REQUIRED_FIELDS = [
  'phone', 'dob', 'street_address', 'town', 'district', 'postal_code', 'grad_year',
  'current_church_name', 'current_church_city', 'current_church_country',
  'pastor_name', 'church_member', 'church_denomination', 'ministerial_credentials',
  'ministry_positions', 'national_leader_name', 'national_leader_position',
  'national_leader_address'
];

// Everything the form may submit; any other field in the request is ignored
const FORM_FIELDS = [...REQUIRED_FIELDS, 'country', 'message'];

async function renderAlumni(req, res, { error = null, form = {}, existingAlumni = null, status = 200 } = {}) {
  const user = req.session.user;
  let alumni = [];
  let page = emptyPage('page');

  if (user.role === 'admin') {
    ({ items: alumni, page } = await paginate(db.getDb().collection('alumni'), {
      sort: { submittedAt: -1 },
      pageParam: 'page',
      req
    }));
  } else if (user.role === 'alumni' && !existingAlumni) {
    existingAlumni = await db.getDb().collection('alumni').findOne({ userId: user.id });
  }

  res.status(status).render('alumni', {
    title: 'Alumni Registration',
    alumni,
    page,
    existingAlumni,
    form,
    error,
    success: req.query.success === 'true'
  });
}

// GET /alumni
exports.getAlumni = async (req, res, next) => {
  try {
    await renderAlumni(req, res);
  } catch (err) {
    next(err);
  }
};

function validateAlumni(data) {
  if (missingFields(data, REQUIRED_FIELDS).length > 0) return 'Please fill in all required fields.';
  if (!isValidPhone(data.phone)) return 'Invalid phone number. Use the international format, e.g. +266 5812 3456';

  const dob = new Date(data.dob);
  if (isNaN(dob) || dob > new Date()) return 'Please enter a valid date of birth.';

  const gradYear = parseInt(data.grad_year, 10);
  if (!(gradYear >= 1950 && gradYear <= new Date().getFullYear())) return 'Please enter a valid graduation year.';

  if (['church_member', 'ministerial_credentials'].some(f => !['Yes', 'No'].includes(data[f]))) {
    return 'Please answer all Yes/No questions.';
  }
  return null;
}

// POST /alumni
exports.postAlumni = async (req, res, next) => {
  const user = req.session.user;
  const form = pickFields(req.body, FORM_FIELDS);

  try {
    if (user.role !== 'alumni') {
      return renderAlumni(req, res, { error: 'Only alumni accounts can submit this registration.', status: 403 });
    }

    const alumniCollection = db.getDb().collection('alumni');

    // Prevent duplicate submissions
    const existing = await alumniCollection.findOne({ userId: user.id });
    if (existing) {
      return renderAlumni(req, res, { error: 'You have already submitted your alumni registration.', existingAlumni: existing });
    }

    const error = validateAlumni(form);
    if (error) {
      return renderAlumni(req, res, { error, form, status: 400 });
    }

    try {
      await alumniCollection.insertOne({
        ...form,
        country: 'Lesotho',
        // Identity always comes from the session, never from the form
        userId: user.id,
        name: user.name,
        email: user.email,
        submittedAt: new Date()
      });
    } catch (err) {
      // The unique index on userId caught a double submit
      if (err.code === 11000) return res.redirect('/alumni?success=true');
      throw err;
    }

    res.redirect('/alumni?success=true');
  } catch (err) {
    next(err);
  }
};
