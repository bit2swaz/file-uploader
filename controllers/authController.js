const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.render('auth/register', {
        error: 'Email already registered',
        email,
        name
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.render('auth/register', {
          error: 'Error logging in after registration',
          email,
          name
        });
      }
      res.redirect('/');
    });
  } catch (error) {
    res.render('auth/register', {
      error: 'Error creating account',
      email: req.body.email,
      name: req.body.name
    });
  }
};

const login = (req, res) => {
  res.render('auth/login', { error: req.flash('error') });
};

const loginPost = (req, res) => {
  res.redirect('/');
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/auth/login');
  });
};

module.exports = {
  register,
  login,
  loginPost,
  logout
}; 