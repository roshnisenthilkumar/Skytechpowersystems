/**
 * middleware/requestLogger.js — Custom middleware (INT222 Unit V)
 */
const fs   = require('fs');
const path = require('path');

const requestLogger = (req, res, next) => {
  const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} IP:${req.ip}\n`;
  fs.appendFile(path.join(__dirname, '../logs/requests.log'), line, () => {});
  next();
};

module.exports = requestLogger;
