const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./db/connect');
const { ensureAuth } = require('./middleware/auth');

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware (MongoDB Store for Production)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // secure cookies in production
    },
  })
);

// Make logged-in user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect DB then start server
connectDB()
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Routes
    app.use('/', require('./routes/homeRoutes'));
    app.use('/apply', ensureAuth, require('./routes/applyRoutes'));
    app.use('/alumni', ensureAuth, require('./routes/alumniRoutes'));
    app.use('/academics', require('./routes/academics'));
    app.use('/contact', require('./routes/contactRoutes'));
    app.use('/auth', require('./routes/authRoutes'));

    // 404 Page
    app.use((req, res) => {
      res.status(404).render('404', { title: 'Page Not Found' });
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
  });
