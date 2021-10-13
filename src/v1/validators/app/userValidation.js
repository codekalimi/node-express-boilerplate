'use strict';

const Joi = require('joi');

function validateByStatus(input) {
  const schema = Joi.object().keys({
    status: Joi.boolean().required(),
  });
  return Joi.validate(input, schema);
}

module.exports = {

  validateChangePassword: (input) => {
    const schema = Joi.object().keys({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    });
    return Joi.validate(input, schema);
  },

  validateSendVerificationCode: (input) => {
    const schema = Joi.object().keys({
      shortCode: Joi.string().required(),
      newPhoneNumber: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateVerificationCode: (input) => {
    const schema = Joi.object().keys({
      shortCode: Joi.string().required(),
      newPhoneNumber: Joi.string().required(),
      verificationCode: Joi.number().required(),
    });
    return Joi.validate(input, schema);
  },

  validateDeleteUser: input => {
    const schema = Joi.object().keys({
      questionId: Joi.string().required(),
      answerId: Joi.string().required().allow(''),
      description: Joi.string().required().allow(''),
      verificationCode: Joi.number().required(),
    });
    return Joi.validate(input, schema);
  },

  validateUpdateImages: input => {
    const schema = Joi.object().keys({
      galleryImages: Joi.array().items(Joi.string().required()).required(),
    });
    return Joi.validate(input, schema);
  },

  validateUpdateDescription: input => {
    const schema = Joi.object().keys({
      description: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateUpdateOnlineStatus: (input) => {
    return validateByStatus(input);
  },

  validateUpdateVisibility: (input) => {
    return validateByStatus(input);
  },

  validateUpdateDistance: input => {
    const schema = Joi.object().keys({
      distance: Joi.number().required(),
    });
    return Joi.validate(input, schema);
  },

  validateUpdateNotification: input => {
    const schema = Joi.object().keys({
      isChatNotificationEnabled: Joi.boolean().required(),
      isLikeNotificationEnabled: Joi.boolean().required(),
      isSuperLikeNotificationEnabled: Joi.boolean().required(),
      isMatchNotificationEnabled: Joi.boolean().required(),
    });
    return Joi.validate(input, schema);
  },

  validateUpdateEmail: input => {
    const schema = Joi.object().keys({
      email: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateSubscription: input => {
    const schema = Joi.object().keys({
      packageName: Joi.string().required(),
      packageExpiry: Joi.number().required(),
      price: Joi.number().required(),
    });
    return Joi.validate(input, schema);
  },

};
