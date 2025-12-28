/**
 * Analytics utilities for gathering project statistics
 */

const db = require('../db');
const logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get total statistics about the database
 */
async function getDatabaseStats() {
  try {
    const results = await db.query(`
      SELECT 
        COUNT(*) as total_images,
        AVG(CHAR_LENGTH(name)) as avg_name_length,
        AVG(CHAR_LENGTH(description)) as avg_description_length,
        COUNT(DISTINCT author) as unique_authors,
        MIN(date) as oldest_image,
        MAX(date) as newest_image
      FROM data
    `);

    return results[0] || {};
  } catch (error) {
    logger.error('Error getting database stats:', error.message);
    throw error;
  }
}

/**
 * Get storage statistics
 */
async function getStorageStats() {
  try {
    const IMAGES_DIR = path.join(__dirname, '../public/images');
    
    let totalSize = 0;
    let fileCount = 0;

    try {
      const files = await fs.readdir(IMAGES_DIR);
      
      for (const file of files) {
        try {
          const filePath = path.join(IMAGES_DIR, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount += 1;
          }
        } catch (err) {
          logger.warn(`Failed to stat file ${file}:`, err.message);
        }
      }
    } catch (err) {
      logger.warn('Failed to read images directory:', err.message);
    }

    return {
      total_files: fileCount,
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
      average_file_size_bytes: fileCount > 0 ? Math.round(totalSize / fileCount) : 0
    };
  } catch (error) {
    logger.error('Error getting storage stats:', error.message);
    throw error;
  }
}

/**
 * Get usage statistics by time period
 */
async function getUsageStats(period = 'daily') {
  try {
    let groupBy;
    
    switch(period) {
      case 'hourly':
        groupBy = 'DATE_FORMAT(date, "%Y-%m-%d %H:00:00")';
        break;
      case 'weekly':
        groupBy = 'DATE_FORMAT(date, "%Y-W%u")';
        break;
      case 'monthly':
        groupBy = 'DATE_FORMAT(date, "%Y-%m")';
        break;
      case 'daily':
      default:
        groupBy = 'DATE(date)';
    }

    const results = await db.query(`
      SELECT 
        ${groupBy} as time_period,
        COUNT(*) as uploads_count,
        COUNT(DISTINCT author) as unique_authors
      FROM data
      GROUP BY ${groupBy}
      ORDER BY time_period ASC
    `);

    return results || [];
  } catch (error) {
    logger.error('Error getting usage stats:', error.message);
    throw error;
  }
}

/**
 * Get statistics by author
 */
async function getAuthorStats() {
  try {
    const results = await db.query(`
      SELECT 
        author,
        COUNT(*) as images_count,
        AVG(CHAR_LENGTH(description)) as avg_description_length,
        MIN(date) as first_upload,
        MAX(date) as last_upload
      FROM data
      WHERE author IS NOT NULL AND author != ''
      GROUP BY author
      ORDER BY images_count DESC
    `);

    return results || [];
  } catch (error) {
    logger.error('Error getting author stats:', error.message);
    throw error;
  }
}

/**
 * Get detailed timeline statistics
 */
async function getTimelineStats() {
  try {
    const results = await db.query(`
      SELECT 
        DATE(date) as date,
        COUNT(*) as uploads,
        GROUP_CONCAT(DISTINCT author SEPARATOR ', ') as authors,
        GROUP_CONCAT(name SEPARATOR ', ') as image_names
      FROM data
      GROUP BY DATE(date)
      ORDER BY date DESC
      LIMIT 30
    `);

    return results || [];
  } catch (error) {
    logger.error('Error getting timeline stats:', error.message);
    throw error;
  }
}

/**
 * Get comprehensive analytics summary
 */
async function getAnalyticsSummary() {
  try {
    const [dbStats, storageStats, authorsData] = await Promise.all([
      getDatabaseStats(),
      getStorageStats(),
      getAuthorStats()
    ]);

    const topAuthors = authorsData.slice(0, 5);
    const avgUploadsPerDay = dbStats.total_images > 0 
      ? (dbStats.total_images / (Math.max(1, calculateDaysDifference(dbStats.oldest_image, dbStats.newest_image)))).toFixed(2)
      : 0;

    return {
      summary: {
        total_images: dbStats.total_images || 0,
        unique_authors: dbStats.unique_authors || 0,
        total_storage_mb: storageStats.total_size_mb,
        average_daily_uploads: avgUploadsPerDay,
        date_range: {
          oldest: dbStats.oldest_image,
          newest: dbStats.newest_image
        }
      },
      storage: storageStats,
      top_authors: topAuthors,
      database_info: {
        avg_name_length: (parseFloat(dbStats.avg_name_length) || 0).toFixed(2),
        avg_description_length: (parseFloat(dbStats.avg_description_length) || 0).toFixed(2)
      }
    };
  } catch (error) {
    logger.error('Error getting analytics summary:', error.message);
    throw error;
  }
}

/**
 * Helper function to calculate days difference
 */
function calculateDaysDifference(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
}

module.exports = {
  getDatabaseStats,
  getStorageStats,
  getUsageStats,
  getAuthorStats,
  getTimelineStats,
  getAnalyticsSummary
};
