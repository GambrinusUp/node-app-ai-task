/**
 * Photo Gallery Routes
 * Improved: parameterized queries (SQL injection fix), proper error handling, async/await
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const logger = require('../utils/logger');
const { sanitizeInput, validateFormData, validateImageExtension, validateFilePath } = require('../utils/validation');

const router = express.Router();

const IMAGES_DIR = path.join(__dirname, '../public/images');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Ensure images directory exists
 */
async function ensureImagesDir() {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to ensure images directory:', error.message);
  }
}

ensureImagesDir();

/**
 * Convert stream to buffer
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    
    stream.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_FILE_SIZE) {
        reject(new Error('File size exceeds maximum limit'));
        return;
      }
      chunks.push(chunk);
    });
    
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * GET / - Home page
 */
router.get('/', (req, res, next) => {
  try {
    res.render('index', { title: 'PhotoGallery', version: '0.1.0' });
  } catch (error) {
    logger.error('Error rendering home page:', error.message);
    next(error);
  }
});

/**
 * POST /new - Upload new image
 * Fixed: SQL injection vulnerability, proper error handling, correct HTTP codes
 */
router.post('/new', async (req, res, next) => {
  try {
    // Check if image file is provided
    if (!req.files || !req.files['image']) {
      logger.warn('Image upload attempt without file');
      return res.status(400).json({
        error: 'image required',
        message: 'Please provide an image file'
      });
    }

    const imageFile = req.files['image'];
    
    // Validate file extension
    if (!validateImageExtension(imageFile.path)) {
      logger.warn('Invalid image extension:', imageFile.path);
      return res.status(400).json({
        error: 'invalid_extension',
        message: `Invalid file extension. Allowed: jpg, jpeg, png, gif, webp`
      });
    }

    // Validate form data
    const validationErrors = validateFormData(req.body);
    if (validationErrors.length > 0) {
      logger.warn('Form validation errors:', validationErrors);
      return res.status(400).json({
        error: 'validation_error',
        messages: validationErrors
      });
    }

    // Generate safe filename
    const ext = path.extname(imageFile.path).toLowerCase();
    const fileName = uuidv4() + ext;
    const filePath = path.join(IMAGES_DIR, fileName);

    // Validate file path (prevent directory traversal)
    if (!validateFilePath(fileName)) {
      logger.error('Suspicious file path detected:', fileName);
      return res.status(400).json({
        error: 'invalid_filename',
        message: 'Invalid filename'
      });
    }

    // Read file data from stream
    const imageData = await streamToBuffer(imageFile);

    // Save file asynchronously
    await fs.writeFile(filePath, imageData);
    logger.info('Image saved:', { fileName, size: imageData.length });

    // Insert into database with parameterized query (SQL injection safe)
    const name = sanitizeInput(req.body.name || '');
    const description = sanitizeInput(req.body.description || '');
    const author = sanitizeInput(req.body.author || '');

    const result = await db.query(
      'INSERT INTO data (name, description, author, path) VALUES (?, ?, ?, ?)',
      [name, description, author, fileName]
    );

    logger.info('Image record inserted:', { id: result.insertId, fileName });

    // Return success response with file name
    res.status(200).json({
      success: true,
      fileName: fileName,
      id: result.insertId,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    logger.error('Error uploading image:', error.message);
    
    // Clean up file if it was created but DB insert failed
    if (error.insertId) {
      try {
        await fs.unlink(path.join(IMAGES_DIR, error.fileName));
      } catch (unlinkErr) {
        logger.error('Failed to clean up file:', unlinkErr.message);
      }
    }

    res.status(500).json({
      error: 'upload_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to upload image'
    });
  }
});

/**
 * GET /all - Fetch all images
 * Fixed: proper error handling and response codes
 */
router.get('/all', async (req, res, next) => {
  try {
    const images = await db.query('SELECT id, name, description, author, path, date as created_at FROM data ORDER BY date DESC');
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    logger.error('Error fetching images:', error.message);
    
    res.status(500).json({
      error: 'fetch_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch images'
    });
  }
});

module.exports = router;

