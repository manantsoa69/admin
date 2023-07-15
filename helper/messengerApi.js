//helper/messengerApi.js
const axios = require('axios');
require('dotenv').config();
const { logger } = require('../helper/saveSubscription');
const TOKEN = process.env.TOKEN;
const PAGE_ID = process.env.PAGE_ID;

const sendMessage = async (senderId, message) => {
  try {
    const options = {
      method: 'POST',
      url: `https://graph.facebook.com/v11.0/${PAGE_ID}/messages`,
      params: {
        access_token: TOKEN,
      },
      data: {
        recipient: { id: senderId },
        messaging_type: 'RESPONSE',
        message: { text: message },
      },
    };


    const response = await axios(options);
    return 1;
  } catch (error) {
    logger.error('Error occurred while sending message:', error);
    return 0;
  }
};

module.exports = {
  sendMessage,
};
