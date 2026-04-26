import jwt from 'jsonwebtoken';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

//Role is embedded in the JWT payload so no DB round-trip is needed.
const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

const isAdminOrDriver = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'driver') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin or driver privileges required.' });
};

export { authenticateJWT, isAdmin, isAdminOrDriver };