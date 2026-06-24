// controllers/alumniController.js
const db = require('../db/connect');

async function fetchAllAlumni() {
  return db.getDb().collection('alumni').find().sort({ submittedAt: -1 }).toArray();
}

// GET /alumni
exports.getAlumni = async (req, res) => {
  const user = req.session.user;
  let alumni = [];
  let existingAlumni = null;

  try {
    if (user.role === 'admin') {
      alumni = await fetchAllAlumni();
    } else if (user.role === 'alumni') {
      existingAlumni = await db.getDb().collection('alumni').findOne({ userId: user.id });
    }
  } catch (err) {
    console.error('Failed to load alumni:', err);
  }

  res.render('alumni', {
    title: 'Alumni Registration',
    user,
    alumni,
    existingAlumni,
    error: null,
    success: req.query.success === 'true'
  });
};

// POST /alumni
exports.postAlumni = async (req, res) => {
  const user = req.session.user;
  let alumni = [];

  const renderError = async (msg, existingAlumni = null) => {
    if (user.role === 'admin') {
      try { alumni = await fetchAllAlumni(); } catch (_) {}
    }
    res.render('alumni', {
      title: 'Alumni Registration',
      user,
      alumni,
      existingAlumni,
      error: msg,
      success: false
    });
  };

  try {
    // Prevent duplicate submissions
    const existing = await db.getDb().collection('alumni').findOne({ userId: user.id });
    if (existing) {
      return renderError('You have already submitted your alumni registration.', existing);
    }

    const requiredFields = [
      'phone', 'dob', 'street_address', 'town', 'district', 'postal_code', 'grad_year',
      'current_church_name', 'current_church_city', 'current_church_country',
      'pastor_name', 'church_member', 'church_denomination', 'ministerial_credentials',
      'ministry_positions', 'national_leader_name', 'national_leader_position',
      'national_leader_address'
    ];

    const missing = requiredFields.filter(f => !req.body[f] || req.body[f].trim() === '');
    if (missing.length > 0) {
      return renderError('Please fill in all required fields.');
    }

    const alumniData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      ...req.body,
      message: req.body.message?.trim() || '',
      submittedAt: new Date()
    };

    await db.getDb().collection('alumni').insertOne(alumniData);
    res.redirect('/alumni?success=true');

  } catch (err) {
    console.error('Alumni save error:', err);
    renderError('Server error. Please try again.');
  }
};
