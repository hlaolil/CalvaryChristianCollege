// controllers/applyController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');

async function fetchAllApplications() {
  return db.getDb().collection('applications').find().sort({ submittedAt: -1 }).toArray();
}

// GET /apply
exports.getApply = async (req, res) => {
  const user = req.session.user;
  let applications = [];
  let existingApplication = null;

  try {
    if (user.role === 'admin') {
      applications = await fetchAllApplications();
    } else if (user.role === 'applicant') {
      existingApplication = await db.getDb().collection('applications').findOne({ userId: user.id });
    }
  } catch (err) {
    console.error('Failed to load applications:', err);
  }

  res.render('apply', {
    title: 'Application Form',
    user,
    applications,
    existingApplication,
    error: null,
    success: req.query.success === 'true'
  });
};

// POST /apply
exports.postApply = async (req, res) => {
  const user = req.session.user;
  let applications = [];

  const renderError = async (msg, existingApplication = null) => {
    if (user.role === 'admin') {
      try { applications = await fetchAllApplications(); } catch (_) {}
    }
    res.render('apply', {
      title: 'Application Form',
      user,
      applications,
      existingApplication,
      error: msg,
      success: false
    });
  };

  try {
    // Prevent duplicate submissions
    const existing = await db.getDb().collection('applications').findOne({ userId: user.id });
    if (existing) {
      return renderError('You have already submitted an application.', existing);
    }

    const requiredFields = [
      'phone', 'dob', 'street_address', 'town', 'district', 'postal_code',
      'high_school', 'grad_year', 'salvation', 'baptism', 'holy_spirit',
      'current_church_name', 'current_church_city', 'current_church_country',
      'pastor_name', 'church_member', 'church_denomination', 'personal_denomination',
      'ministerial_credentials', 'ministry_positions', 'national_leader_name',
      'national_leader_position', 'national_leader_address', 'program', 'semester'
    ];

    const missing = requiredFields.filter(f => !req.body[f] || req.body[f].trim() === '');
    if (missing.length > 0) {
      return renderError('Please fill in all required fields.');
    }

    const applicationData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      ...req.body,
      status: 'Pending',
      message: req.body.message?.trim() || '',
      submittedAt: new Date()
    };

    await db.getDb().collection('applications').insertOne(applicationData);
    res.redirect('/apply?success=true');

  } catch (err) {
    console.error('Application save error:', err);
    renderError('Server error. Please try again.');
  }
};

// POST /apply/:id/status  (admin only)
exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/apply');
  }

  try {
    await db.getDb().collection('applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
  } catch (err) {
    console.error('Status update error:', err);
  }

  res.redirect('/apply');
};
