'use strict';

const { respondError } = require('../helpers/response');
const generalLogger = require('../../config/winston');
const { StatusCode } = require('../helpers/constants');

module.exports = {

  requireApiKey: (req, res, next) => {
    const apiKey = req.header('x-api-key');
    generalLogger.log('info', JSON.stringify(req.headers));
    generalLogger.log('info', JSON.stringify(req.body));
    req.language = req.header('Accept-Language') ? String(req.header('Accept-Language')).toLowerCase() : 'en';
    if (!apiKey) {
      return next(respondError('x-api-key is required in header', StatusCode.UNAUTHORIZED));
    }
    if (apiKey !== process.env.API_KEY) {
      return next(respondError('invalid api-key', StatusCode.UNAUTHORIZED));
    }
    return next();
  },

};
