//helper/saveSubscription.js
const mysql = require('mysql2/promise');
const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL);
const pool = mysql.createPool(process.env.DATABASE_URL);
console.log('mysql connection established!');

const { sendMessage } = require('./messengerApi');

const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    return true;
  }

  const expireSeconds = 600; // Set expiration time in seconds (e.g., 600 seconds = 10 minutes)
  try {
    console.log('Saving subscription: 10M');
    const expireDateISOString = new Date(Date.now() + expireSeconds * 1000).toISOString();
    const formattedValue = `${expireDateISOString} (Free)`;
    const cacheKey = `${fbid}`;

    // Update the item in Redis cache with expiration time and " (Free)" suffix
    await redis.setex(cacheKey, expireSeconds, formattedValue);
    const connection = await pool.getConnection();

    try {
      // Check if the FBID already exists in the MySQL database
      await connection.query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDateISOString]);
    } finally {
      connection.release();
    }

    // Successful save to both Redis and MySQL
    const saved = true;

    if (saved) {
      console.log('Saved successfully.');
      await sendMessage(
        fbid,
        `Félicitations ! 🎉 Vous avez remporté un abonnement gratuit de 10 minutes pour découvrir notre chatbot, Ahy.

     Profitez de cette expérience unique et laissez-moi répondre à vos questions et vous offrir une assistance personnalisée.😉`
      );
    } else {
      console.log('Failed to save.');
    }

    return true;
  } catch (error) {
    console.log('Error occurred while saving subscription:', error);

    // If there was an error, delete the data related to the fbid from Redis
    try {
      await redis.del(fbid);
      console.log('Deleted data related to fbid in Redis:', fbid);
    } catch (deleteError) {
      console.log('Error occurred while deleting data in Redis:', deleteError);
    }

    // If there was an error, delete the data related to the fbid from MySQL
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM users WHERE fbid = ?', [fbid]);
      console.log('Deleted data related to fbid in MySQL:', fbid);
    } catch (deleteError) {
      console.log('Error occurred while deleting data in MySQL:', deleteError);
    } finally {
      connection.release();
    }

    return false;
  }
};

module.exports = {
  saveSubscription,
};
