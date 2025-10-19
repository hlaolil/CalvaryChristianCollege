//const bcrypt = require('bcryptjs');
const db = require('../db/connect');

exports.getLogin = (req, res) => {
  res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getDb().collection('users').findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  req.session.user = { id: user._id, name: user.name, email: user.email };
  res.redirect('/');
};

exports.getRegister = (req, res) => {
  res.render('register', { 
    error: null, 
    title: 'Register', 
    user: req.session?.user || null 
  });
};

exports.postRegister = async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await db.getDb().collection('users').findOne({ email });

  if (existingUser) {
    return res.render('register', { error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.getDb().collection('users').insertOne({
    name,
    email,
    password: hashedPassword,
  });

  res.redirect('/login');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
