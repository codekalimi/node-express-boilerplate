'use strict';

const Joi = require('joi');

module.exports = {

  validateNewMessage: input => {
    const schema = Joi.object().keys({
      chatId: Joi.string().required(),
      senderId: Joi.string().required(),
      receiverId: Joi.string().required(),
      message: Joi.string().required().allow(''),
      isMedia: Joi.boolean().required(),
      file: Joi.string().required().allow(''),
    });
    return Joi.validate(input, schema);
  },

  validateLikeMessage: input => {
    const schema = Joi.object().keys({
      receiverId: Joi.string().required(),
      messageId: Joi.string().required(),
      status: Joi.boolean().required(),
    });
    return Joi.validate(input, schema);
  },

};
