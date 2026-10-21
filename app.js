const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./db/connect');
const { ensureAuth, loadUser, homeFor } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) {
    console.error('SESSION_SECRET must be set in production.');
    process.exit(1);
  }
  // Development only: a random secret means sessions reset on every restart
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('SESSION_SECRET is not set; using a temporary secret. Set it in .env.');
}

const app = express();

// Behind a reverse proxy (Render, Heroku, nginx) so secure cookies and req.ip work
if (isProduction || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// -----------------------------------------------------------
// 1. Core middleware
// -----------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': isProduction ? [] : null
      }
    }
  })
);
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProduction ? '7d' : 0 }));

// -----------------------------------------------------------
// 2. Session
// -----------------------------------------------------------
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME,
      ttl: 14 * 24 * 60 * 60, // 14 days
      touchAfter: 24 * 3600,   // re-save at most once per day
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in ms
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  })
);

// -----------------------------------------------------------
// 3. GLOBAL TEMPLATE VARIABLES (user + path + year)
// -----------------------------------------------------------
app.use((req, res, next) => {
  // Session user; loadUser refreshes it from the database once connected
  res.locals.user = req.session?.user || null;
  res.locals.homeHref = homeFor(res.locals.user);

  // Current URL path – used for active‑nav highlighting
  res.locals.path = req.path;

  // Handy for footers / copyright
  res.locals.currentYear = new Date().getFullYear();

  // Lesotho‑specific locale (for dates)
  res.locals.locale = 'en-LS';
  res.locals.timezone = 'Africa/Maseru';

  next();
});
app.use(csrfProtection);

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
    console.log('Connected to MongoDB');

    // Needs the database, so it runs after connecting
    app.use(loadUser);

    // ──────── ROUTES ────────
    app.use('/', require('./routes/homeRoutes'));
    app.use('/apply', ensureAuth, require('./routes/applyRoutes'));
    app.use('/alumni', ensureAuth, require('./routes/alumniRoutes'));
    app.use('/academics', require('./routes/academics'));
    app.use('/contact', require('./routes/contactRoutes'));
    app.use('/auth', require('./routes/authRoutes'));
    app.use('/student-portal', ensureAuth, require('./routes/studentRoutes'));

    // ──────── 404 ────────
    app.use((req, res) => {
      res.status(404).render('404', { title: 'Page Not Found' });
    });

    // ──────── ERRORS ────────
    app.use((err, req, res, next) => {
      console.error(err);
      // The error may have happened before the template locals were set
      res.locals.user = res.locals.user || null;
      res.locals.path = res.locals.path || req.path;
      res.locals.currentYear = res.locals.currentYear || new Date().getFullYear();
      res.locals.homeHref = res.locals.homeHref || '/';
      res.status(err.status || 500).render('error', {
        title: 'Something Went Wrong',
        message: 'Sorry, something went wrong on our side. Please try again in a moment.'
      });
    });

    // ──────── LISTEN ────────
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
