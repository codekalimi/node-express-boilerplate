'use strict';

// node modules
const _ = require('lodash');

// models
const User = require('../../models/User');
const UserSubscription = require('../../models/UserSubscription');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../helpers/response');
const { getMessageFromValidationError, generateVerificationCode } = require('../../helpers/utils');
const { validateSignUp, validateSendVerificationCode, validateVerificationCode, validateSaveProfile, validateSignIn } = require('../../validators/app/authValidation');
const { getAuthTokens } = require('../../helpers/token');
const constValues = require('../../helpers/constants');
const localesKeys = require('../../../locales/keys.json');

module.exports = {

  tokenRefresh: async(req, res, next) => {
    const { id } = req.user;
    const { accessToken } = getAuthTokens(id, true);
    return respondSuccess(res, req.__(localesKeys.global.REQUEST_WAS_SUCCESSFULL), constValues.StatusCode.OK, { accessToken });
  },

  sendVerificationCode: async(req, res, next) => {
    const { body, language } = req;
    const { phoneNumber, shortCode } = body;

    const { error } = validateSendVerificationCode(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userExist = await User.findOne({ shortCode, phoneNumber}).select('isVerified');
    if (userExist && userExist.isVerified) {
      return respondFailure(res, req.__(localesKeys.auth.MOBILE_ALREADY_EXISTS), constValues.StatusCode.CONFLICT);
    }

    const sixDigitCode = generateVerificationCode();
    process.env.VERIFICATION_CODE = sixDigitCode;
    body.verificationCode = sixDigitCode;
    body.language = language;

    if (!userExist) {
      const newUser = new User(body);
      await newUser.save();
      await new UserSubscription({ user: newUser._id }).save();
    } else if (!userExist.isVerified) {
      await User.updateOne({ _id: userExist._id }, {
        $set: {
          verificationCode: sixDigitCode,
          language,
        },
      });
    }
    return respondSuccess(res, req.__(localesKeys.auth.VERIFICATION_CODE_SENT_SUCCESSFULLY));
  },

  verifyCode: async(req, res, next) => {
    const { body } = req;
    const { phoneNumber, shortCode, verificationCode } = body;

    const { error } = validateVerificationCode(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userData = await User.findOne({ phoneNumber, shortCode });
    if (!userData) {
      return respondFailure(res, req.__(localesKeys.auth.USER_NOT_FOUND), constValues.StatusCode.NOT_FOUND);
    }
    if (!userData.status) {
      return respondFailure(res, req.__(localesKeys.auth.USER_DEACTIVE), constValues.StatusCode.CONFLICT);
    }
    if (userData.isVerified) {
      return respondFailure(res, req.__(localesKeys.auth.USER_ALREADY_VERIFIED), constValues.StatusCode.CONFLICT);
    }
    if (Number(userData.verificationCode) !== Number(verificationCode)) {
      return respondFailure(res, req.__(localesKeys.auth.WRONG_OTP), constValues.StatusCode.CONFLICT);
    }
    await User.updateOne({ _id: userData.id }, { $set: { verificationCode: null } });
    const { accessToken, refreshToken } = getAuthTokens(userData.id);
    return respondSuccess(res, req.__(localesKeys.auth.USER_VERIFIED_SUCCESSFULLY), constValues.StatusCode.OK, {
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  },

  register: async(req, res, next) => {
    const { body, language, user } = req;

    const userExist = await User.findOne({ _id: user.id, isVerified: constValues.status.ACTIVE });
    if (userExist) {
      return respondFailure(res, req.__(localesKeys.auth.MOBILE_ALREADY_EXISTS), constValues.StatusCode.CONFLICT);
    }

    const { error } = validateSignUp(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userData = await User.findOne({ _id: user.id });
    userData.firstName = body.firstName;
    userData.lastName = body.lastName;
    userData.gender = body.gender;
    userData.genderInterestedIn = body.genderInterestedIn;
    userData.galleryImages = body.galleryImages;
    userData.isChildrenRequired = body.isChildrenRequired;
    userData.password = body.password;
    userData.deviceToken = body.deviceToken;
    userData.language = language;
    userData.isVerified = true;
    await userData.save();
    return respondSuccess(res, req.__(localesKeys.auth.USER_REGISTERED_SUCCESSFULLY), constValues.StatusCode.CREATED);
  },

  saveProfile: async(req, res, next) => {
    const { id } = req.user;
    const { body } = req;

    const { error } = validateSaveProfile(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    body.isProfileComplete = constValues.status.ACTIVE;
    await User.updateOne({ _id: id }, body);
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY), constValues.StatusCode.CREATED);
  },

  signIn: async(req, res, next) => {
    const { body } = req;
    const { shortCode, phoneNumber, deviceToken } = body;

    const { error } = validateSignIn(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const user = await User.findOne({ shortCode, phoneNumber });
    const { accessToken, refreshToken } = getAuthTokens(user._id);
    await User.updateOne({ _id: user._id }, { $set: { deviceToken: deviceToken } });
    return respondSuccess(res, req.__(localesKeys.auth.LOG_IN_SUCCESSFULLY), constValues.StatusCode.OK, {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userData: _.pick(user, ['_id', 'firstName', 'lastName', 'email', 'shortCode', 'phoneNumber', 'isProfileComplete', 'isOnboardingComplete', 'genderInterestedIn', 'isChildrenRequired',
        'maxDistance', 'showOnlineStatus', 'hideProfile', 'isChatNotificationEnabled', 'isLikeNotificationEnabled', 'isSuperLikeNotificationEnabled', 'isMatchNotificationEnabled', 'activePackage']),
    });
  },

  logout: async(req, res, next) => {
    const { id } = req.user;
    await User.updateOne({ _id: id }, { $set: { deviceToken: null } });
    return respondSuccess(res, req.__(localesKeys.auth.LOG_OUT_SUCCESSFULLY));
  },

};
