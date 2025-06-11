const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/files/dashboard');
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated
}; 