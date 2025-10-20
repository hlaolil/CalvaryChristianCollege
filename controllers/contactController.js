const db = require('../db/connect'); // Optional; for logging to DB

// GET /contact (unchanged)
exports.getContact = (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    success: req.query.success === 'true',
    error: null
  });
};

// POST /contact
exports.sendContact = async (req, res) => {
  const { name, email, message, phone } = req.body;  // Includes optional phone

  // Basic validation (phone is optional)
  if (!name || !email || !message) {
    return res.render('contact', { 
      title: 'Contact Us',
      success: false,
      error: 'All fields (name, email, message) are required.'
    });
  }

  try {
    // Log submission (for debugging)
    console.log('Contact form submitted:', req.body);

    // Optional: Save to DB
    if (db) {
      await db.getDb().collection('contacts').insertOne({ 
        name, 
        email, 
        phone,  // Include even if empty
        message, 
        date: new Date() 
      });
      console.log('Contact saved to DB');
    }

    res.redirect('/contact?success=true');
  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.render('contact', { 
      title: 'Contact Us',
      success: false,
      error: 'An error occurred while submitting your message. Please try again later.'
    });
  }
};