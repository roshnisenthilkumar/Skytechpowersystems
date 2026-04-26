/**
 * routes/review.js — Reviews CRUD (INT222 Unit III + IV)
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { Review } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET all reviews + stats
router.get('/', async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const total = await Review.countDocuments({ approved: true });
    const data  = await Review.find({ approved: true }).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);

    const all     = await Review.find({ approved: true });
    const counts  = [0,0,0,0,0];
    let totalStar = 0;
    all.forEach(r => { counts[r.stars-1]++; totalStar += r.stars; });
    const avgRating = all.length ? (totalStar / all.length).toFixed(1) : '0.0';

    res.json({ data, stats: { total: all.length, avgRating, starCounts: counts }, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

// POST new review
router.post('/', [
  body('name').trim().notEmpty(),
  body('stars').isInt({ min:1, max:5 }),
  body('text').trim().isLength({ min:10 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const review = await new Review(req.body).save();
    req.app.get('io')?.emit('rating:updated', { review: review.toObject() });
    req.app.get('appEvents')?.emit('review:new', req.body);
    res.status(201).json({ message: 'Review submitted!', data: review });
  } catch (err) { next(err); }
});

// DELETE (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
