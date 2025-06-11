require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fileUpload = require('express-fileupload');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const folderRoutes = require('./routes/folders');
const sharedRoutes = require('./routes/shared');

// Import middleware
const { isAuthenticated } = require('./middlewares/auth');

// Create Express app
const app = express();

// Log environment for debugging
console.log('Environment:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Initialize Prisma Client
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  console.log('Continuing without database connection...');
}

// Configure session store
let sessionOptions;
if (process.env.DATABASE_URL) {
  try {
    const pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Test the database connection
    pgPool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Database connection successful:', res.rows[0]);
      }
    });
    
    sessionOptions = {
      store: new PgSession({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'fallback-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    };
  } catch (error) {
    console.error('Error setting up PostgreSQL session store:', error);
    // Fall back to memory session store
    sessionOptions = {
      secret: process.env.SESSION_SECRET || 'fallback-secret-key',
      resave: false,
      saveUninitialized: false
    };
  }
} else {
  console.warn('DATABASE_URL not found, using memory session store');
  sessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false
  };
}

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'uploads', 'temp')
}));
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware to make user available to views
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/files/dashboard');
  }
  res.render('index');
});

app.use('/auth', authRoutes);
app.use('/files', isAuthenticated, fileRoutes);
app.use('/folders', isAuthenticated, folderRoutes);
app.use('/shared', sharedRoutes);

// Error handling
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: 'Something went wrong on our end.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export Prisma client for use in other modules
module.exports = { prisma }; 