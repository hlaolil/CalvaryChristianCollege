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
  const { program, semester, message } = req.body;
  const user = req.session.user;

  try {
    // Basic validation
    if (!program || !semester) {
      return res.render('apply', { 
        title: 'Application Form',
        error: 'Program and semester are required.',
        success: false
      });
    }

    await db.getDb().collection('applications').insertOne({
      userId: user.id,
      name: user.name,
      email: user.email,
      program,
      semester,
      message: message || '',
      submittedAt: new Date()
    });

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