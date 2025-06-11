const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const fs = require('fs');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create a PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure express-fileupload
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'Session',
        createTableIfMissing: true,
        // Map column names
        columns: {
            sid: 'sid',
            sess: 'data',
            expire: 'expiresAt'
        }
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables middleware
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// Passport configuration
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Routes
const authRouter = require('./routes/auth');
const fileRouter = require('./routes/fileRoutes');

// Root route - redirect based on authentication
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/files/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

app.use('/auth', authRouter);
app.use('/files', fileRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 