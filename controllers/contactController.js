// controllers/contactController.js
const db = require('../db/connect');

// GET /contact – show form + admin: all users
exports.getContact = async (req, res) => {
  let users = [];

  // Only admins see all users
  if (req.session.user?.role === 'admin') {
    try {
      const cursor = db.getDb()
        .collection('users')
        .find()
        .sort({ createdAt: -1 });

      users = await cursor.toArray(); // plain JS objects
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  res.render('contact', {
    title: 'Contact Us',
    user: req.session.user,
    users,                  // ← only for admin
    success: req.query.success === 'true',
    error: null
  });
};

// POST /contact – unchanged logic, just renamed to sendContact
exports.sendContact = async (req, res) => {
  const { name, email, message, phone } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.render('contact', {
      title: 'Contact Us',
      user: req.session.user,
      success: false,
      error: 'All fields (name, email, message) are required.'
    });
  }

  try {
    console.log('Contact form submitted:', req.body);

    // Save to DB
    await db.getDb().collection('contacts').insertOne({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      message: message.trim(),
      date: new Date()
    });

    console.log('Contact saved to DB');
    res.redirect('/contact?success=true');
  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.render('contact', {
      title: 'Contact Us',
      user: req.session.user,
      success: false,
      error: 'An error occurred while submitting your message. Please try again later.'
    });
  }
};
