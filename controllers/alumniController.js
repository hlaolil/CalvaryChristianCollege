const db = require('../db/connect');

// GET /alumni
exports.getAlumni = (req, res) => {
  res.render('alumni', { 
    title: 'Alumni Form',
    error: null,
    success: req.query.success === 'true'
  });
};

// POST /alumni
exports.postAlumni = async (req, res) => {
  const user = req.session.user;

  try {
    // Required fields
    const requiredFields = [
      'phone', 'dob', 'street_address', 'town', 'district', 'postal_code', 'grad_year',
      'current_church_name', 'current_church_city', 'current_church_country',
      'pastor_name', 'church_member', 'church_denomination', 'ministerial_credentials', 'ministry_positions', 'national_leader_name',
      'national_leader_position', 'national_leader_address',
    ];

    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    if (missingFields.length > 0) {
      return res.render('alumni', { 
        title: 'Alumni Form',
        error: `Missing or empty required fields: ${missingFields.join(', ')}.`,
        success: false
      });
    }

    // Prepare data, ensuring optionals are set
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
    console.error(err);
    res.render('alumni', { 
      title: 'Alumni Form',
      error: 'Server error. Please try again.',
      success: false
    });
  }
};
