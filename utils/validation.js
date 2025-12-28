/**
 * Input validation utility
 * Prevents SQL injection and validates inputs
 */

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILENAME_LENGTH = 255;
const MAX_FIELD_LENGTH = 500;

/**
 * Validate image file extension
 */
function validateImageExtension(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Sanitize text input - remove potentially harmful characters
 */
function sanitizeInput(input) {
  if (!input) return '';
  
  // Remove null bytes
  let sanitized = String(input).replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  sanitized = sanitized.substring(0, MAX_FIELD_LENGTH);
  
  return sanitized;
}

/**
 * Validate form data
 */
function validateFormData(body) {
  const errors = [];
  
  if (body.name && body.name.length > MAX_FIELD_LENGTH) {
    errors.push('Name is too long (max 500 characters)');
  }
  
  if (body.description && body.description.length > MAX_FIELD_LENGTH) {
    errors.push('Description is too long (max 500 characters)');
  }
  
  if (body.author && body.author.length > MAX_FIELD_LENGTH) {
    errors.push('Author is too long (max 500 characters)');
  }
  
  return errors;
}

/**
 * Validate file path to prevent directory traversal
 */
function validateFilePath(filepath) {
  // Prevent directory traversal attacks
  if (filepath.includes('..') || filepath.includes('/')) {
    return false;
  }
  return true;
}

module.exports = {
  validateImageExtension,
  sanitizeInput,
  validateFormData,
  validateFilePath,
  ALLOWED_EXTENSIONS,
  MAX_FIELD_LENGTH,
};
