//routes/homeRoute.js
const { logger } = require('../helper/saveSubscription');

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  logger.info('GET request received');
  res.sendStatus(200);
});

module.exports = {
  router
};
