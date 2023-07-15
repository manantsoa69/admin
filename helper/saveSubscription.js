//helper/saveSubscription.js
const axios = require('axios');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');
require('dotenv').config();
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
   // winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const getRequestUrl = process.env.API_CHECK || 'https://jkhz.adaptable.app/api/check' ;
const redis = new Redis(process.env.REDIS_URL);
logger.info('redis!');
const pool = mysql.createPool(process.env.DATABASE_URL);
logger.info('PlanetScale!');

const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    return true;
  }

  const currentDate = new Date();
  const expireDate = new Date(currentDate.getTime() + 10 * 60 * 1000); // Add 10 minutes to the current date

  try {
    logger.info('Saving subscription:', subscriptionStatus);

    const cacheKey = `${fbid}`;
    const expireDateISOString = expireDate.toISOString();

    // Update the item in Redis cache
    await redis.set(cacheKey, expireDateISOString);

    const connection = await pool.getConnection();

    try {
      // Check if the FBID already exists in the MySQL database
      const [existingItem] = await connection.query('SELECT fbid, expireDate FROM users WHERE fbid = ?', [fbid]);

      if (existingItem.length > 0) {
        // Update the expiration date for expired subscriptions in MySQL
        await connection.query('UPDATE users SET expireDate = ? WHERE fbid = ?', [expireDateISOString, fbid]);
      } else {
        // Insert the new item into the MySQL database
        await connection.query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDateISOString]);
      }
    } finally {
      connection.release();
    }

    // Send a GET request to another server
    const response = await axios.get(getRequestUrl);

    return true;
  } catch (error) {
    logger.error('Error occurred while saving subscription:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,
  logger,
  redis,
  pool
};
