/**
 * models/index.js — All Mongoose schemas (INT222 Unit IV)
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── USER ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  phone:     { type: String },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

// ── ENQUIRY ───────────────────────────────────────────────────
const enquirySchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, trim: true, lowercase: true },
  phone:     { type: String, required: true },
  service:   { type: String, required: true },
  message:   { type: String },
  status:    { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

// ── REVIEW ────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  role:      { type: String, default: 'Customer' },
  stars:     { type: Number, required: true, min: 1, max: 5 },
  text:      { type: String, required: true, minlength: 10 },
  approved:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ── PRODUCT ───────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  category:  { type: String, required: true, enum: ['ups','industrial','battery','stabilizer','inverter','solar'] },
  price:     { type: String, required: true },
  unit:      { type: String, default: '/ Piece' },
  brand:     { type: String },
  badge:     { type: String },
  specs:     [String],
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ── CHAT ──────────────────────────────────────────────────────
const chatSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  message:   { type: String, required: true },
  room:      { type: String, default: 'general' },
  isAI:      { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User:    mongoose.model('User',    userSchema),
  Enquiry: mongoose.model('Enquiry', enquirySchema),
  Review:  mongoose.model('Review',  reviewSchema),
  Product: mongoose.model('Product', productSchema),
  ChatMsg: mongoose.model('ChatMsg', chatSchema),
};
