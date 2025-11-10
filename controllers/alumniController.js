// controllers/alumniController.js
const db = require('../db/connect');

// GET /alumni – show form + admin list
exports.getAlumni = async (req, res) => {
  let alumni = [];

  // Only admins see all alumni
  if (req.session.user?.role === 'admin') {
    try {
      const cursor = db.getDb()
        .collection('alumni')
        .find()
        .sort({ submittedAt: -1 });

      alumni = await cursor.toArray(); // plain objects for EJS
    } catch (err) {
      console.error('Failed to load alumni:', err);
    }
  }

  res.render('alumni', {
    title: 'Alumni Form',
    user: req.session.user,
    alumni,                 // ← only for admin
    error: null,
    success: req.query.success === 'true'
  });
};

// POST /alumni – submit new alumni
exports.postAlumni = async (req, res) => {
  const user = req.session.user;

  try {
    // Required fields (you can trim this list to match actual alumni form)
    const requiredFields = [
      'phone', 'dob', 'street_address', 'town', 'district', 'postal_code', 'grad_year',
      'current_church_name', 'current_church_city', 'current_church_country',
      'pastor_name', 'church_member', 'church_denomination', 'ministerial_credentials',
      'ministry_positions', 'national_leader_name', 'national_leader_position',
      'national_leader_address'
    ];

    const missingFields = requiredFields.filter(
      field => !req.body[field] || req.body[field].trim() === ''
    );

    if (missingFields.length > 0) {
      return res.render('alumni', {
        title: 'Alumni Form',
        user: req.session.user,
        alumni: [], // optional: keep list if re-rendering
        error: `Missing: ${missingFields.join(', ')}`,
        success: false
      });
    }

    const alumniData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      ...req.body,
      message: req.body.message || '',
      credential_denomination: req.body.credential_denomination || '',
      submittedAt: new Date()
    };

    await db.getDb().collection('alumni').insertOne(alumniData);
    res.redirect('/alumni?success=true');
  } catch (err) {
    console.error('Alumni save error:', err);
    res.render('alumni', {
      title: 'Alumni Form',
      user: req.session.user,
      error: 'Server error. Please try again.',
      success: false
    });
  }
};
