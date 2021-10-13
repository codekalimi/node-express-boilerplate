'use strict';

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const moment = require('moment');

// models
const User = require('../../models/User');
const DeleteUser = require('../../models/DeleteUser');
const Chat = require('../../models/Chat');
const ReportUser = require('../../models/ReportUser');
const UserMatch = require('../../models/UserMatch');
const UserSubscription = require('../../models/UserSubscription');

// helpers
const { respondSuccess, respondFailure, respondError } = require('../../helpers/response');
const { sendMail } = require('../../helpers/notification');
const { getMessageFromValidationError, generateVerificationCode } = require('../../helpers/utils');
const { passwordChangeEmail } = require('../../templates/emailTemplate');
const { validateChangePassword, validateSendVerificationCode, validateVerificationCode, validateDeleteUser, validateUpdateImages, validateUpdateDescription,
  validateUpdateOnlineStatus, validateUpdateVisibility, validateUpdateDistance, validateUpdateNotification, validateUpdateEmail, validateSubscription } = require('../../validators/app/userValidation');
const constValues = require('../../helpers/constants');
const localesKeys = require('../../../locales/keys.json');
const { getAuthTokens } = require('../../helpers/token');

module.exports = {

  getProfile: async(req, res, next) => {
    const { id, firstName, lastName, galleryImages, description, DOB } = req.user;
    const userData = { id, firstName, lastName, galleryImages, description, age: new Date().getFullYear() - Number(DOB.year) };
    const queAnsData = [];
    userData.astroProfile = queAnsData;
    return respondSuccess(res, req.__(localesKeys.global.REQUEST_WAS_SUCCESSFULL), constValues.StatusCode.OK, userData);
  },

  changePassword: async(req, res, next) => {
    const { language, id, email } = req.user;
    const { body } = req;
    const { oldPassword, newPassword } = body;

    const { error } = validateChangePassword(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const user = await User.findOne({ _id: id });
    if (!user) {
      return respondFailure(res, req.__(localesKeys.auth.USER_NOT_FOUND, language));
    }
    user.comparePassword(oldPassword, async(err, isMatch) => {
      if (err) {
        return respondError(res, req.__(localesKeys.global.TRY_AGAIN, language), constValues.StatusCode.INTERNAL_SERVER_ERROR);
      }
      if (!isMatch) {
        return respondFailure(res, req.__(localesKeys.auth.OLD_PASSWORD_NOT_MATCHED, language), constValues.StatusCode.CONFLICT);
      }
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();
      await sendMail(passwordChangeEmail({ email: email.toLowerCase() }));
      return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
    });
  },

  /*
  adminEntry: async(req, res, next) => {
    await new User({ userName: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.DUMMYPASSWORD, userType: constValues.UserType.ADMIN }).save();
    return respondSuccess(res, convertLocaleMessage(constValues.auth.USER_REGISTERED_SUCCESSFULLY), constValues.StatusCode.CREATED);
  },

  getAllUser: async(req, res, next) => {
    const { language } = req.user;
    const { skip, limit } = req.params;
    const allUsers = await User.find({ userType: constValues.UserType.USER })
      .select('userName email mobile image createdAt isVerified status')
      .sort({ _id: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
    return respondSuccess(res, convertLocaleMessage(constValues.global.REQUEST_WAS_SUCCESSFULL, language), constValues.StatusCode.OK, allUsers);
  },

  activateUser: async(req, res, next) => {
    const { language } = req.user;
    const { userID } = req.body;

    const { error } = validateActivateUser(req.body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userDetail = await User.findOne({ _id: userID });
    if (!userDetail) {
      return respondFailure(res, convertLocaleMessage(constValues.auth.USER_NOT_FOUND, language), constValues.StatusCode.NOT_FOUND);
    }
    if (userDetail.status) {
      return respondFailure(res, convertLocaleMessage(constValues.auth.ALREADY_ACTIVE, language), constValues.StatusCode.CONFLICT);
    }
    await User.updateOne({ _id: userID }, { $set: { status: constValues.status.ACTIVE } });
    return respondSuccess(res, convertLocaleMessage(constValues.global.UPDATED_SUCCESSFULLY, language));
  },

  deactivateUser: async(req, res, next) => {
    const { language } = req.user;
    const { userID } = req.body;

    const { error } = validateDeactivateUser(req.body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userDoc = await User.findOne({ _id: userID });
    if (!userDoc) {
      return respondFailure(res, convertLocaleMessage(constValues.auth.USER_NOT_FOUND, language), constValues.StatusCode.NOT_FOUND);
    }
    if (!userDoc.status) {
      return respondFailure(res, convertLocaleMessage(constValues.auth.ALREADY_DEACTIVE, language), constValues.StatusCode.CONFLICT);
    }
    await User.updateOne({ _id: userID }, { $set: { status: constValues.status.DEACTIVE } });
    return respondSuccess(res, convertLocaleMessage(constValues.global.UPDATED_SUCCESSFULLY, language));
  },
  */

  likedUsers: async(req, res, next) => {
    const { likedUsers, superLikedUsers, currentLocation } = req.user;
    const longitude = currentLocation.location.coordinates[0];
    const latitude = currentLocation.location.coordinates[1];
    const { skip, limit } = req.params;
    const userData = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceMultiplier: 0.001,
          key: 'currentLocation.location.coordinates',
          distanceField: 'distance',
        },
      },
      {
        $match: {
          _id: { $in: likedUsers },
          status: constValues.status.ACTIVE,
          isVerified: constValues.status.ACTIVE,
          isProfileComplete: constValues.status.ACTIVE,
          isOnboardingComplete: constValues.status.ACTIVE,
        },
      },
      {
        $unwind: '$astroProfile',
      },
      {
        $addFields: {
          matches: {
            $sum: {
              $size: {
                $filter: {
                  input: '$qna',
                  as: 'item',
                  cond: {
                    $and: [
                      { $eq: [ '$$item.questionId', '$astroProfile.questionId' ] },
                      { $setIsSubset: [['$astroProfile.answerId'], '$$item.answers' ] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          year: { $year: new Date },
          superLike: {
            $cond: [
              { $gt: [ { $size: { $setIntersection: [ ['$_id'], superLikedUsers ] } }, 0 ] }, true, false,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          firstName: { $first: '$firstName'},
          distance: { $first: '$distance'},
          lastName: { $first: '$lastName'},
          galleryImages: { $first: '$galleryImages'},
          DOB: { $first: '$DOB'},
          matches: { $push: '$matches'},
          year: { $first: '$year'},
          superLike: { $first: '$superLike'},
          place: { $first: '$currentLocation.place' },
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          age: { $subtract: [ '$year', '$DOB.year' ] },
          distance: 1,
          place: 1,
          superLike: 1,
          galleryImages: 1,
          astroScore: {
            $reduce: {
              input: '$matches',
              initialValue: 0,
              in: { $sum: [ '$$value', '$$this' ] },
            },
          },
        },
      },
      {
        $skip: Number(skip),
      },
      {
        $limit: Number(limit),
      },
    ]);
    return respondSuccess(res, req.__(localesKeys.global.REQUEST_WAS_SUCCESSFULL), constValues.StatusCode.OK, userData);
  },

  matchedUsers: async(req, res, next) => {
    const { id, likedUsers, currentLocation } = req.user;
    const longitude = currentLocation.location.coordinates[0];
    const latitude = currentLocation.location.coordinates[1];
    const { skip, limit } = req.params;
    const userData = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceMultiplier: 0.001,
          key: 'currentLocation.location.coordinates',
          distanceField: 'distance',
        },
      },
      {
        $match: {
          _id: { $in: likedUsers },
          likedUsers: { $in: [ObjectId(id)] },
          isOnboardingComplete: constValues.status.ACTIVE,
          isProfileComplete: constValues.status.ACTIVE,
          isVerified: constValues.status.ACTIVE,
          status: constValues.status.ACTIVE,
        },
      },
      {
        $unwind: '$astroProfile',
      },
      {
        $addFields: {
          matches: {
            $sum: {
              $size: {
                $filter: {
                  input: '$qna',
                  as: 'singleItem',
                  cond: {
                    $and: [
                      { $eq: [ '$$singleItem.questionId', '$astroProfile.questionId' ] },
                      { $setIsSubset: [['$astroProfile.answerId'], '$$singleItem.answers' ] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          currYear: { $year: new Date },
        },
      },
      {
        $group: {
          _id: '$_id',
          firstName: { $first: '$firstName'},
          distance: { $first: '$distance'},
          lastName: { $first: '$lastName'},
          galleryImages: { $first: '$galleryImages'},
          DOB: { $first: '$DOB'},
          matches: { $push: '$matches'},
          currYear: { $first: '$currYear'},
          place: { $first: '$currentLocation.place' },
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          age: { $subtract: [ '$currYear', '$DOB.year' ] },
          distance: 1,
          place: 1,
          galleryImages: 1,
          astroScore: {
            $reduce: {
              input: '$matches',
              initialValue: 0,
              in: { $sum: [ '$$value', '$$this' ] },
            },
          },
        },
      },
      {
        $skip: Number(skip),
      },
      {
        $limit: Number(limit),
      },
    ]);
    return respondSuccess(res, req.__(localesKeys.global.REQUEST_WAS_SUCCESSFULL), constValues.StatusCode.OK, userData);
  },

  updatePhoneNumberVerificationCode: async(req, res, next) => {
    const { body, user } = req;
    const { newPhoneNumber } = body;

    const { error } = validateSendVerificationCode(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userExist = await User.findOne({ _id: user.id, isVerified: constValues.status.ACTIVE });
    const sixDigitCode = generateVerificationCode();
    process.env.VERIFICATION_CODE = sixDigitCode;
    await User.updateOne({ _id: userExist._id }, {
      $set: {
        verificationCode: sixDigitCode,
        newPhoneNumber,
      },
    });
    return respondSuccess(res, req.__(localesKeys.auth.VERIFICATION_CODE_SENT_SUCCESSFULLY));
  },

  updatePhoneNumberVerifyCode: async(req, res, next) => {
    const { body, language } = req;
    const { newPhoneNumber, shortCode, verificationCode } = body;

    const { error } = validateVerificationCode(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const userData = await User.findOne({ newPhoneNumber, shortCode, verificationCode });
    if (!userData.status) {
      return respondFailure(res, req.__(localesKeys.auth.USER_DEACTIVE, language), constValues.StatusCode.CONFLICT);
    }
    if (!userData) {
      return respondFailure(res, req.__(localesKeys.auth.USER_NOT_FOUND, language), constValues.StatusCode.NOT_FOUND);
    }
    if (Number(userData.verificationCode) !== Number(verificationCode)) {
      return respondFailure(res, req.__(localesKeys.auth.WRONG_OTP, language), constValues.StatusCode.CONFLICT);
    }
    if (userData.isVerified) {
      return respondFailure(res, req.__(localesKeys.auth.USER_ALREADY_VERIFIED, language), constValues.StatusCode.CONFLICT);
    }
    await User.updateOne({ _id: userData.id }, { $set: { phoneNumber: newPhoneNumber, verificationCode: null } });
    const { accessToken, refreshToken } = getAuthTokens(userData.id);
    return respondSuccess(res, req.__(localesKeys.auth.USER_VERIFIED_SUCCESSFULLY), constValues.StatusCode.OK, {
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  },

  deleteVerificationCode: async(req, res, next) => {
    const { user } = req;
    const userExist = await User.findOne({ _id: user.id, isVerified: constValues.status.ACTIVE });
    const sixDigitCode = generateVerificationCode();
    process.env.VERIFICATION_CODE = sixDigitCode;
    await User.updateOne({ _id: userExist._id }, {
      $set: {
        deleteVerificationCode: sixDigitCode,
      },
    });
    return respondSuccess(res, req.__(localesKeys.auth.VERIFICATION_CODE_SENT_SUCCESSFULLY), constValues.StatusCode.OK);
  },

  deleteUserAccount: async(req, res, next) => {
    const { user, body, language } = req;
    const { id, firstName, lastName, deleteVerificationCode } = user;
    const { questionId, answerId, description, verificationCode } = body;

    const { error } = validateDeleteUser(req.body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    if (Number(deleteVerificationCode) !== Number(verificationCode)) {
      return respondFailure(res, req.__(localesKeys.auth.WRONG_OTP, language), constValues.StatusCode.CONFLICT);
    }
    await new DeleteUser({ firstName, lastName, questionId, answerId, description }).save();
    await User.deleteOne({ _id: id });
    await UserMatch.deleteMany({ $or: [ { user: id }, { matchedUser: id } ] });
    await Chat.deleteMany({ $or: [ { senderId: id }, { receiverId: id } ] });
    await ReportUser.deleteMany({ $or: [ { user: id }, { reportedBy: id } ] });
    await UserSubscription.deleteMany({ user: id });
    return respondSuccess(res, req.__(localesKeys.global.DELETED_SUCCESSFULLY), constValues.StatusCode.OK);
  },

  updateImages: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { galleryImages } = body;

    const { error } = validateUpdateImages(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, { $push: { galleryImages: { $each: galleryImages } } });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateDescription: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { description } = body;

    const { error } = validateUpdateDescription(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, { $set: { description: description } });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateOnlineStatus: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { status } = body;

    const { error } = validateUpdateOnlineStatus(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, { $set: { showOnlineStatus: status } });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateVisibility: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { status } = body;

    const { error } = validateUpdateVisibility(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, { $set: { hideProfile: status } });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateDistance: async(req, res, next) => {
    const { body, user } = req;
    const { id, activePackage } = user;
    const { distance } = body;

    const { error } = validateUpdateDistance(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    if (Number(distance) > Number(constValues.packageFeatures[activePackage].maxDistance)) {
      return respondFailure(res, req.__(localesKeys.subscription.MAX_DISTANCE_ALLOWED), constValues.StatusCode.CONFLICT);
    }
    await User.updateOne({ _id: id }, { $set: { maxDistance: Number(distance) } });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateNotification: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { isChatNotificationEnabled, isLikeNotificationEnabled, isSuperLikeNotificationEnabled, isMatchNotificationEnabled } = body;

    const { error } = validateUpdateNotification(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, {
      $set: { isChatNotificationEnabled: isChatNotificationEnabled, isLikeNotificationEnabled: isLikeNotificationEnabled,
        isSuperLikeNotificationEnabled: isSuperLikeNotificationEnabled, isMatchNotificationEnabled: isMatchNotificationEnabled },
    });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  updateEmail: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { email } = body;

    const { error } = validateUpdateEmail(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    await User.updateOne({ _id: id }, { email: email });
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

  subscription: async(req, res, next) => {
    const { body, user } = req;
    const { id } = user;
    const { packageName, packageExpiry, price } = body;

    const { error } = validateSubscription(body);
    if (error) {
      return next(respondError(getMessageFromValidationError(error)));
    }

    const radiusDistance = constValues.packageFeatures[packageName].maxDistance;
    const expiryDate = moment().add(Number(packageExpiry), 'months').format('YYYY-MM-DD 23:59:59');
    await User.updateOne({ _id: id }, { activePackage: packageName, maxDistance: radiusDistance, packageExpiry: expiryDate });
    await new UserSubscription({ user: id, name: packageName, price: price, duration: Number(packageExpiry) }).save();
    return respondSuccess(res, req.__(localesKeys.global.UPDATED_SUCCESSFULLY));
  },

};
