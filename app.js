'use strict';

require('dotenv').config();

// node modules
const http = require('http');

// npm modules
const chalk = require('chalk');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const express = require('express');
const fileUploader = require('express-fileupload');

// app modules
const winston = require('./src/config/winston');
const mongoose = require('./src/database/mongoose');
const { urlNotFound } = require('./src/v1/helpers/response');
const { requireApiKey } = require('./src/v1/middlewares/apiRequest');

// express instance
const app = express();

// cors options
var whitelist = ['http://localhost:7000', 'http://', 'http://'];
const corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  exposedHeaders: 'Content-Type, X-Auth-Token',
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  preflightContinue: false,
};

// Database setup
mongoose.connect();

// middlewares
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(morgan('combined', { stream: winston.stream }));
app.use(fileUploader());

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/logs', express.static('logs'));
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/v1', requireApiKey, require('./src/v1/routes/index'));

// error handler
app.use((req, res, next) => {
  return next(urlNotFound());
});

app.use((err, req, res, next) => {
  const error = err;
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: error.message ? error.message : err,
  });
  console.log(chalk.red('Error:', err));
});

// server setup
const port = process.env.PORT || 7000;
const server = http.createServer(app);
server.listen(port, (err) => {
  if (err) {
    console.log(chalk.red(`Error : ${err}`));
    process.exit(-1);
  }
  console.log(chalk.blue(`${process.env.APP} is running on ${port}`));
});

module.exports = server;
