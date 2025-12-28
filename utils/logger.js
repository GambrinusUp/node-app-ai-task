/**
 * Logger utility
 * Simple logging with timestamps and levels
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Write log message
 */
function writeLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
  
  // Log to console in development
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.log(logMessage);
  }
  
  // Log to file
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

module.exports = {
  error: (message, data) => writeLog(LOG_LEVELS.ERROR, message, data),
  warn: (message, data) => writeLog(LOG_LEVELS.WARN, message, data),
  info: (message, data) => writeLog(LOG_LEVELS.INFO, message, data),
  debug: (message, data) => writeLog(LOG_LEVELS.DEBUG, message, data),
};
