const express = require('express');
const router = express.Router();
const { checkSubscription } = require('../helper/subscriptionHelper');
const { sendMessage } = require('../helper/messengerApi');
const { chatCompletion } = require('../helper/openaiApi');
const { checkNumber } = require('./numberValidation');
const axios = require('axios');

// Function to save the response and prompt to Supabase
async function saveResponseToSupabase(prompt, response) {
  try {
    const supabaseUrl = 'https://zqfylsnexoejgcmaxlsy.supabase.co';
    const supabaseKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZnlsc25leG9lamdjbWF4bHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkxNjAxMzgsImV4cCI6MjAwNDczNjEzOH0.dlyQU6eqpm14uPceuxZWIWbqWjNUIw9S6YnpXrsqu1k';

    const { data, error } = await axios.post(
      `${supabaseUrl}/rest/v1/chat_responses`,
      { prompt, response },
      {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    if (error) {
      console.error('Error saving to Supabase:', error.message);

    }
  } catch (error) {
    console.error('Error occurred while saving to Supabase:', error.message);
  }
}

// Handle POST requests for incoming messages
router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;
    if (entry && entry.length > 0 && entry[0].messaging && entry[0].messaging.length > 0) {
      const { sender: { id: fbid }, message } = entry[0].messaging[0];
      if (message && message.text) {
        const { text: query } = message;
        console.log(`${fbid}`);

        // Check if the message is a number
        if (/^\d+$/.test(query)) {
          const numberValidationResult = await checkNumber(query, fbid);
          await sendMessage(fbid, numberValidationResult);
          console.log('Number message sent:', numberValidationResult);

          return res.sendStatus(200);
        }

        const { subscriptionStatus } = await checkSubscription(fbid);
        if (subscriptionStatus === 'A') {
          // Convert the query to a number
          const numberQuery = parseInt(query);
          // Modify the prompt if the number is greater than 3
          if (numberQuery > 3) {
            query = query.replace(String(numberQuery), '3');
          }

          // Call the chatCompletion function to get the response
          const result = await chatCompletion(query, fbid);
          saveResponseToSupabase(query, result.response),

          // Use Promise.all to save the prompt and response to Supabase and send the response to the user concurrently
          await Promise.all([           
            sendMessage(fbid, result.response)
          ]);

          console.log('ok');
        }
      } else {
        // If the message or message.text is undefined, send an automatic reply to the user
        const errorMessage = `
        Bonjour ! 👋
        C'est un plaisir de vous rencontrer, je suis votre assistant virtuel, prêt à vous fournir une assistance efficace et professionnelle. N'hésitez pas à me poser vos questions, je suis là pour vous accompagner en toute circonstance. 😊.`;
        sendMessage(fbid, errorMessage);
      }
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }

  res.sendStatus(200);
});

// Handle GET requests for verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = {
  router,
};
