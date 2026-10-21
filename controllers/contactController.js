// controllers/contactController.js
const db = require('../db/connect');
const { str, isValidEmail } = require('../utils/validate');
const { paginate, emptyPage } = require('../utils/pagination');

// Never send password hashes or reset tokens to the template
const USER_LIST_PROJECTION = { name: 1, email: 1, phoneNumber: 1, role: 1, createdAt: 1 };

// Renders the contact page; admins also see all users and all contact messages
async function renderContact(req, res, { error = null, form = {}, status = 200 } = {}) {
  const user = req.session.user;
  let users = [];
  let contacts = [];
  let usersPage = emptyPage('upage');
  let contactsPage = emptyPage('cpage');

  if (user?.role === 'admin') {
    const database = db.getDb();
    ({ items: users, page: usersPage } = await paginate(database.collection('users'), {
      sort: { createdAt: -1 },
      projection: USER_LIST_PROJECTION,
      pageParam: 'upage',
      req
    }));
    ({ items: contacts, page: contactsPage } = await paginate(database.collection('contacts'), {
      sort: { date: -1 },
      pageParam: 'cpage',
      req
    }));
  }

  res.status(status).render('contact', {
    title: 'Contact Us',
    users,
    contacts,
    usersPage,
    contactsPage,
    form,
    success: req.query.success === 'true',
    error
  });
}

// GET /contact
exports.getContact = async (req, res, next) => {
  try {
    await renderContact(req, res);
  } catch (err) {
    next(err);
  }
};

// POST /contact
exports.sendContact = async (req, res, next) => {
  const user = req.session.user;
  // Logged-in users can't edit their name/email on the form, so use the account's
  const name = user ? user.name : str(req.body.name);
  const email = user ? user.email : str(req.body.email).toLowerCase();
  const phone = str(req.body.phone);
  const message = str(req.body.message);
  const form = { name, email, phone, message };

  try {
    if (!name || !email || !message) {
      return renderContact(req, res, { error: 'All fields (name, email, message) are required.', form, status: 400 });
    }
    if (!isValidEmail(email)) {
      return renderContact(req, res, { error: 'Please enter a valid email address.', form, status: 400 });
    }
    if (message.length > 5000) {
      return renderContact(req, res, { error: 'Please keep your message under 5000 characters.', form, status: 400 });
    }

    await db.getDb().collection('contacts').insertOne({
      name,
      email,
      phone,
      message,
      date: new Date()
    });

    res.redirect('/contact?success=true');
  } catch (err) {
    next(err);
  }
};
