const express = require('express');
const responseTime = require('response-time');

require('dotenv').config();
const webApp = express();
const PORT = process.env.PORT || 3000;
const startResponseTimer = (req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = Math.round((end[0] * 1000) + (end[1] / 1000000));
    console.log(`${duration}ms`);
  });
  next();
};

webApp.use(responseTime());
webApp.use(startResponseTimer);
webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());

const fbWebhookRoute = require('./routes/fbWebhookRoute');
const homeRoute = require('./routes/homeRoute');

webApp.use('/facebook', fbWebhookRoute.router);
webApp.use('/', homeRoute.router);


webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
