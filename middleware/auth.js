/**
 * middleware/auth.js — JWT Authentication & RBAC (INT222 Unit V)
 */
const jwt  = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const token =
      req.headers['authorization']?.split(' ')[1] ||
      req.cookies?.token;

    if (!token) return res.status(401).json({ error: 'No token. Access denied.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skytech_secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found.' });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired.' });
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
  next();
};

module.exports = { authenticateToken, requireRole };
