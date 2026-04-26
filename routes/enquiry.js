/**
 * routes/enquiry.js — Enquiry CRUD (INT222 Unit III + IV)
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { Enquiry } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST — submit enquiry (public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').notEmpty().withMessage('Phone required'),
  body('service').notEmpty().withMessage('Service required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const enq = await new Enquiry(req.body).save();
    req.app.get('io')?.emit('admin:enquiry', { ...req.body, id: enq._id, timestamp: new Date() });
    req.app.get('appEvents')?.emit('enquiry:new', req.body);
    res.status(201).json({ message: 'Enquiry submitted!', id: enq._id });
  } catch (err) { next(err); }
});

// GET — all enquiries with pagination (admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const filter = status ? { status } : {};
    const total  = await Enquiry.countDocuments(filter);
    const data   = await Enquiry.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);
    res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

// PATCH — update status (admin)
router.patch('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const enq = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!enq) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Status updated', data: enq });
  } catch (err) { next(err); }
});

// DELETE (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
