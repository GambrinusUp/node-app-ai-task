/**
 * Database configuration and connection pool
 * Improved: connection pooling, error handling, environment variables
 */

const mysql = require('mysql2/promise');
const logger = require('./utils/logger');

// Configuration from environment variables (or defaults)
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
};

let pool = null;

/**
 * Initialize connection pool
 */
async function initializePool() {
  try {
    pool = mysql.createPool(config);
    logger.info('Database pool initialized successfully');
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database pool:', error);
    throw error;
  }
}

/**
 * Get connection from pool
 */
async function getConnection() {
  if (!pool) {
    await initializePool();
  }
  return pool.getConnection();
}

/**
 * Execute query with parameterized statements (safe from SQL injection)
 */
async function query(sql, values = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * Close connection pool
 */
async function closePool() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}

module.exports = {
  getConnection,
  query,
  initializePool,
  closePool,
};
