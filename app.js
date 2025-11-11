const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const { connectDB } = require('./db/connect');
const { ensureAuth } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------
// 1. Core middleware
// -----------------------------------------------------------
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------
// 2. Session
// -----------------------------------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false,
  })
);

// -----------------------------------------------------------
// 3. GLOBAL TEMPLATE VARIABLES (user + path + year)
// -----------------------------------------------------------
app.use((req, res, next) => {
  // 1. Authenticated user (from your session)
  res.locals.user = req.session?.user || null;

  // 2. Current URL path – used for active‑nav highlighting
  res.locals.path = req.path;               // <-- NEW

  // 3. Handy for footers / copyright
  res.locals.currentYear = new Date().getFullYear();

  // 4. Lesotho‑specific locale (optional, for dates)
  res.locals.locale = 'en-LS';
  res.locals.timezone = 'Africa/Maseru';

  next();
});

// -----------------------------------------------------------
// 4. View engine
// -----------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// -----------------------------------------------------------
// 5. Connect DB → start server
// -----------------------------------------------------------
connectDB()
  .then(() => {
    console.log('Connected to MongoDB (Native Driver)');

    // ──────── ROUTES ────────
    app.use('/', require('./routes/homeRoutes'));
    app.use('/apply', ensureAuth, require('./routes/applyRoutes'));
    app.use('/alumni', ensureAuth, require('./routes/alumniRoutes'));
    app.use('/academics', require('./routes/academics'));
    app.use('/contact', require('./routes/contactRoutes'));
    app.use('/auth', require('./routes/authRoutes'));
    app.use('/student-portal', require('./routes/studentRoutes'));

    // ──────── 404 ────────
    app.use((req, res) => {
      res.status(404).render('404', { title: 'Page Not Found' });
    });

    // ──────── LISTEN ────────
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
