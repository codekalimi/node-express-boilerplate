'use strict';

const Joi = require('joi');

module.exports = {

  validateSignUp: (input) => {
    const schema = Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      gender: Joi.string().valid('male', 'female').required(),
      genderInterestedIn: Joi.string().valid('male', 'female', 'both').required(),
      galleryImages: Joi.array().items(Joi.string().required()).required(),
      isChildrenRequired: Joi.string().valid('yes', 'no', 'maybe').required(),
      password: Joi.string().min(8).required(),
      deviceToken: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateSendVerificationCode: (input) => {
    const schema = Joi.object().keys({
      shortCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateVerificationCode: (input) => {
    const schema = Joi.object().keys({
      shortCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      verificationCode: Joi.number().required(),
    });
    return Joi.validate(input, schema);
  },

  validateSaveProfile: (input) => {
    const schema = Joi.object().keys({
      DOB: Joi.object().keys({
        day: Joi.number().required(),
        month: Joi.number().required(),
        year: Joi.number().required(),
        hour: Joi.number().required(),
        minute: Joi.number().required(),
        timezone: Joi.number().required(),
      }),
      birthPlace: Joi.object().keys({
        place: Joi.string().required(),
        location: Joi.object({
          type: Joi.string().optional(),
          coordinates: Joi.array().min(2).max(2).required(),
        }).required(),
      }),
      currentLocation: Joi.object().keys({
        place: Joi.string().required(),
        location: Joi.object({
          type: Joi.string().optional(),
          coordinates: Joi.array().min(2).max(2).required(),
        }).required(),
      }),
    });
    return Joi.validate(input, schema);
  },

  validateSavePassword: (input) => {
    const schema = Joi.object().keys({
      password: Joi.string().min(8).required(),
    });
    return Joi.validate(input, schema);
  },

  validateSignIn: (input) => {
    const schema = Joi.object().keys({
      shortCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      password: Joi.string().required(),
      deviceToken: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

  validateDashboardSignIn: (input) => {
    const schema = Joi.object().keys({
      email: Joi.string().email({ minDomainAtoms: 2 }).required(),
      password: Joi.string().required(),
    });
    return Joi.validate(input, schema);
  },

};
