// controllers/contactController.js
const db = require('../db/connect');

// GET /contact – show form + admin: users + contacts
exports.getContact = async (req, res) => {
  let users = [];
  let contacts = [];

  // Only admins see data
  if (req.session.user?.role === 'admin') {
    try {
      // === ALL USERS ===
      const userCursor = db.getDb()
        .collection('users')
        .find()
        .sort({ createdAt: -1 });
      users = await userCursor.toArray();

      // === ALL CONTACT MESSAGES ===
      const contactCursor = db.getDb()
        .collection('contacts')
        .find()
        .sort({ date: -1 });
      contacts = await contactCursor.toArray();
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }

  res.render('contact', {
    title: 'Contact Us',
    user: req.session.user,
    users,        // ← all users
    contacts,     // ← all contact form submissions
    success: req.query.success === 'true',
    error: null
  });
};

// POST /contact – unchanged (your current logic)
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
