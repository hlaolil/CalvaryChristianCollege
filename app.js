const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');  // New import
const { connectDB } = require('./db/connect');
const { ensureAuth } = require('./middleware/auth');

// Load environment variables
dotenv.config();
process.env.NODE_ENV = 'production';  // Optional: Set for prod cookies

const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: MongoStore.create({
    mongoUrl: `${process.env.MONGODB_URI}/${process.env.ccdb}`,  // Append DB name here
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60  // 14 days
  }),
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB and then start server
connectDB().then(() => {
  console.log('✅ Connected to MongoDB (Native Driver)');
  // MVC routes
  app.use('/', require('./routes/homeRoutes'));
  app.use('/apply', ensureAuth, require('./routes/applyRoutes'));
  app.use('/alumni', ensureAuth, require('./routes/alumniRoutes'));
  app.use('/academics', require('./routes/academics'));
  app.use('/contact', require('./routes/contactRoutes'));
  app.use('/auth', require('./routes/authRoutes'));
  // 404 handler
  app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
  });
  // Start server
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
});
