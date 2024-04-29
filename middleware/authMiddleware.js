exports.isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    res.redirect('/login'); // Redirect unauthenticated users to login page
  };
  
  exports.isAdmin = (req, res, next) => {
    if (req.session.role === 'Admin') {
      return next();
    }
    res.status(403).send('Unauthorized: Access is restricted to administrators only');
  };
  