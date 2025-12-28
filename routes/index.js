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
const analytics = require('../utils/analytics');

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
 * GET /dashboard - Analytics dashboard page
 */
router.get('/dashboard', (req, res, next) => {
  try {
    res.sendFile(path.join(__dirname, '../public/analytics.html'));
  } catch (error) {
    logger.error('Error rendering dashboard:', error.message);
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

/**
 * Analytics Endpoints
 */

/**
 * GET /analytics/summary - Get comprehensive analytics summary
 */
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const summary = await analytics.getAnalyticsSummary();
    
    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting analytics summary:', error.message);
    
    res.status(500).json({
      error: 'analytics_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch analytics'
    });
  }
});

/**
 * GET /analytics/stats - Get database statistics
 */
router.get('/analytics/stats', async (req, res, next) => {
  try {
    const dbStats = await analytics.getDatabaseStats();
    const storageStats = await analytics.getStorageStats();
    
    res.status(200).json({
      success: true,
      data: {
        database: dbStats,
        storage: storageStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting stats:', error.message);
    
    res.status(500).json({
      error: 'stats_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /analytics/usage - Get usage statistics by time period
 * Query params: period (hourly, daily, weekly, monthly) - default: daily
 */
router.get('/analytics/usage', async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const validPeriods = ['hourly', 'daily', 'weekly', 'monthly'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: 'invalid_period',
        message: `Period must be one of: ${validPeriods.join(', ')}`
      });
    }

    const usageStats = await analytics.getUsageStats(period);
    
    res.status(200).json({
      success: true,
      period: period,
      count: usageStats.length,
      data: usageStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting usage stats:', error.message);
    
    res.status(500).json({
      error: 'usage_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch usage statistics'
    });
  }
});

/**
 * GET /analytics/authors - Get author statistics
 */
router.get('/analytics/authors', async (req, res, next) => {
  try {
    const authorStats = await analytics.getAuthorStats();
    
    res.status(200).json({
      success: true,
      count: authorStats.length,
      data: authorStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting author stats:', error.message);
    
    res.status(500).json({
      error: 'authors_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch author statistics'
    });
  }
});

/**
 * GET /analytics/timeline - Get timeline statistics (last 30 days)
 */
router.get('/analytics/timeline', async (req, res, next) => {
  try {
    const timelineStats = await analytics.getTimelineStats();
    
    res.status(200).json({
      success: true,
      count: timelineStats.length,
      data: timelineStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting timeline stats:', error.message);
    
    res.status(500).json({
      error: 'timeline_failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch timeline'
    });
  }
});

module.exports = router;

