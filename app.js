const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const { connectDB } = require('./db/connect');

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

// Connect to DB first then start server
connectDB().then(() => {
  // Routes
  app.use('/', require('./routes/homeRoutes'));
  app.use('/academics', require('./routes/academicsRoutes'));
  app.use('/contact', require('./routes/contactRoutes'));

  app.use((req, res) => {
    res.status(404).send('Page not found');
  });

  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
});
