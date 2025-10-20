const db = require('../db/connect');

// GET /apply
exports.getApply = (req, res) => {
  res.render('apply', { 
    title: 'Application Form',
    error: null,
    success: req.query.success === 'true'
  });
};

// POST /apply
exports.postApply = async (req, res) => {
  const user = req.session.user;

  try {
    // Required fields
    const requiredFields = [
      'phone', 'dob', 'street_address', 'town', 'district', 'postal_code',
      'high_school', 'grad_year', 'salvation', 'baptism', 'holy_spirit',
      'current_church_name', 'current_church_city', 'current_church_country',
      'pastor_name', 'church_member', 'church_denomination', 'personal_denomination',
      'ministerial_credentials', 'ministry_positions', 'national_leader_name',
      'national_leader_position', 'national_leader_address', 'program', 'semester'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    if (missingFields.length > 0) {
      return res.render('apply', { 
        title: 'Application Form',
        error: `Missing or empty required fields: ${missingFields.join(', ')}.`,
        success: false
      });
    }

    // Prepare data, ensuring optionals are set
    const applicationData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      ...req.body,
      message: req.body.message || '',
      credential_denomination: req.body.credential_denomination || '',
      submittedAt: new Date()
    };

    await db.getDb().collection('applications').insertOne(applicationData);

    res.redirect('/apply?success=true');
  } catch (err) {
    console.error(err);
    res.render('apply', { 
      title: 'Application Form',
      error: 'Server error. Please try again.',
      success: false
    });
  }
};