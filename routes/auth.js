/**
 * routes/auth.js — Register, Login, Logout (INT222 Unit III + V)
 */
const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'skytech_secret', { expiresIn: '7d' });

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (await User.findOne({ email: req.body.email }))
      return res.status(409).json({ error: 'Email already registered.' });

    const user  = await new User(req.body).save();
    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });
    req.session.userId = user._id;
    req.app.get('appEvents')?.emit('user:register', { email: user.email });
    res.status(201).json({ message: 'Registered', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await user.comparePassword(req.body.password)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 86400000 });
    req.session.userId = user._id;
    req.app.get('appEvents')?.emit('user:login', { email: user.email });
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticateToken, (req, res) => res.json({ user: req.user }));

module.exports = router;
