const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const { connectDB } = require('./db/connect');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB and then start server
connectDB().then(() => {
  console.log('✅ Connected to MongoDB (Native Driver)');

  // MVC routes
  app.use('/', require('./routes/homeRoutes'));          // Home page
  app.use('/academics', require('./routes/academics'));  // Academics dashboard/list/add
  app.use('/contact', require('./routes/contactRoutes')); // Contact page

  // API routes
  app.use('/api/academics', require('./routes/api/academics')); // API JSON CRUD

  // 404 handler
  app.use((req, res) => {
    res.status(404).send('Page not found');
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
});
