'use strict';

const appRoot = require('app-root-path');
const winston = require('winston');
require('winston-daily-rotate-file');

const options = {
  info: {
    filename: `${appRoot}/logs/app-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    colorize: true,
    level: 'info',
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
// eslint-disable-next-line new-cap
const logger = new winston.createLogger({
  level: 'verbose',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.align(),
    winston.format.simple(),
    winston.format.prettyPrint(),
    winston.format.printf((log) => {
      return `${log.timestamp} | ${log.level}: ${log.message}`;
    }),
  ),
  transports: [
    // new winston.transports.File(options.file),
    new winston.transports.DailyRotateFile(options.info),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write(message, encoding) {
    // eslint-disable-next-line max-len
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
