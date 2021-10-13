'use strict';

// core modules
const chalk = require('chalk');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

mongoose.connection.on('connected', () => {
  console.log(chalk.blue('MongoDB is connected'));
});

mongoose.connection.on('error', (err) => {
  console.log(chalk.red(`Could not connect to MongoDB because of ${err}`));
  process.exit(-1);
});

exports.connect = () => {
  mongoose.connect(process.env.MONGO_URL, {
    keepAlive: 1,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return mongoose.connection;
};
