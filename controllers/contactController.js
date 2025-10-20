const db = require('../db/connect'); // Optional; only if saving to DB later

// GET /contact
exports.getContact = (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    success: req.query.success === 'true',
    error: null
  });
};

// POST /contact
exports.sendContact = (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.render('contact', { 
      title: 'Contact Us',
      success: false,
      error: 'All fields (name, email, message) are required.'
    });
  }

  // In real use, send email or save to DB
  console.log('Contact form submitted:', req.body);
  
  // TODO: e.g., await db.getDb().collection('contacts').insertOne({ name, email, message, date: new Date() });

  res.redirect('/contact?success=true');
};