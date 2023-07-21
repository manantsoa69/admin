//helper/saveSubscription.js
const axios = require('axios');
require('dotenv').config();

const { redis, pool } = require('../helper/subscriptionHelper');
const getRequestUrl = process.env.API_CHECK;


const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    return true;
  }

  const currentDate = new Date();
  const expireDate = new Date(currentDate.getTime() + 1 * 60 * 1000); // Add 10 minutes to the current date

  try {
    console.log('Saving subscription:', subscriptionStatus);

    const cacheKey = `${fbid}`;
    const expireDateISOString = expireDate.toISOString();

    // Update the item in Redis cache
    await redis.set(cacheKey, expireDateISOString);

    const connection = await pool.getConnection();

    try {
      // Check if the FBID already exists in the MySQL database
      const [existingItem] = await connection.query('INSERT INTO users (fbid, expireDate) VALUES (?, ?)', [fbid, expireDateISOString]);

    } finally {
      connection.release();
    }

    // Send a GET request to another server
    await axios.get(`${getRequestUrl}/api/check`).catch(error => {
      console.log('Error occurred while sending GET request:', error);
    });

    return true;
  } catch (error) {
    console.log('Error occurred while saving subscription:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,

};
