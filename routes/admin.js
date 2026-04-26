/**
 * routes/admin.js — Admin dashboard API (INT222 Unit IV)
 */
const express = require('express');
const { requireRole } = require('../middleware/auth');
const { Enquiry, Review, User, Product } = require('../models');
const router = express.Router();

router.get('/dashboard', requireRole('admin'), async (req, res, next) => {
  try {
    const [enqCount, revCount, userCount, prodCount, newEnqs, recentRevs] = await Promise.all([
      Enquiry.countDocuments(),
      Review.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Enquiry.find({ status: 'new' }).sort({ createdAt: -1 }).limit(10),
      Review.find().sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({ stats: { enqCount, revCount, userCount, prodCount }, newEnqs, recentRevs });
  } catch (err) { next(err); }
});

router.get('/users', requireRole('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ data: users });
  } catch (err) { next(err); }
});

module.exports = router;
