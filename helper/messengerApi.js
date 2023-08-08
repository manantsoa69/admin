// helper/messengerApi.js
const axios = require('axios');
require('dotenv').config();
const TOKEN = process.env.TOKEN;
const PAGE_ID = process.env.PAGE_ID;

// Cache the tokens and IDs
const cachedToken = TOKEN;
const cachedPageID = PAGE_ID;

// Create a single HTTP client instance and reuse it
const apiClient = axios.create({
  baseURL: 'https://graph.facebook.com/v11.0/',
});
// Set the access token in the client instance's defaults
apiClient.defaults.params = {
  access_token: cachedToken,
};

const sendMessage = async (fbid, message) => {
  try {
    await apiClient.post(`${cachedPageID}/messages`, {
      recipient: { id: fbid },
      messaging_type: 'RESPONSE',
      message: { text: message },
    });

    return 1;
  } catch (error) {
    console.error('Error occurred while sending message:', error);
    return 0;
  }
};
module.exports = {
  sendMessage,
};
