/**
 * middleware/errorHandler.js — Global error handler (INT222 Unit III)
 */
const fs   = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
  const status  = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const log = `[${new Date().toISOString()}] ${status} ${message} — ${req.method} ${req.originalUrl}\n`;
  fs.appendFile(path.join(__dirname, '../logs/errors.log'), log, () => {});
  console.error(`❌ [Error] ${status} — ${message}`);
  res.status(status).json({ error: { status, message, path: req.originalUrl } });
};

module.exports = errorHandler;
