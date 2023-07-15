//helper/subscriptionHelper.js
const { logger, redis, pool } = require('../helper/saveSubscription');

const checkSubscription = async (fbid) => {
  try {
    const cacheItem = await redis.get(fbid);
    if (cacheItem) {
     
      if (cacheItem === 'E') {
        return {
          subscriptionStatus: 'E',
          expireDate: 'E'
        };
      }

      return {
        subscriptionStatus: 'A',
        expireDate: cacheItem
      };
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query('SELECT * FROM users WHERE fbid = ?', [fbid]);
      const subscriptionItem = result[0];

      if (!subscriptionItem || !subscriptionItem.expireDate) {
        return {
          subscriptionStatus: 'No subscription',
          expireDate: null
        };
      }

      const currentDate = new Date();
      const expireDate = new Date(subscriptionItem.expireDate);

      if (expireDate > currentDate) {
        return {
          subscriptionStatus: 'A',
          expireDate: expireDate.toISOString()
        };
      } else {
        await Promise.all([
          connection.query('UPDATE users SET expireDate = ? WHERE fbid = ?', ['E', fbid]),
          redis.set(fbid, 'E')
        ]);

        return {
          subscriptionStatus: 'E',
          expireDate: 'E'
        };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error occurred while checking subscription:', error);
    return {
      subscriptionStatus: 'Error',
      expireDate: null
    };
  }
};

module.exports = {
  checkSubscription,
};
