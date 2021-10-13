'use strict';

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// models
const User = require('../../models/User');
const UserMatch = require('../../models/UserMatch');
const Chat = require('../../models/Chat');

// helpers
const { respondSuccess, respondFailure } = require('../../helpers/response');
const { generateChatId } = require('../../helpers/utils');
const localesKeys = require('../../../locales/keys.json');
const constValues = require('../../helpers/constants');

module.exports = {

  createOrGetMatch: async(req, res, next) => {
    const { id } = req.user;
    const { userID } = req.params;
    if (String(userID) === String(id)) {
      return respondFailure(res, req.__(localesKeys.auth.USER_NOT_FOUND), constValues.StatusCode.BAD_REQUEST);
    }
    const existingMatch = await UserMatch.findOne({
      $or: [
        { user: id, matchedUser: userID },
        { user: userID, matchedUser: id },
      ],
    }).populate('user', '_id firstName lastName')
      .populate('matchedUser', '_id firstName lastName');
    if (existingMatch) {
      if (existingMatch.user.id === id) {
        existingMatch.userChatDetail.isInChatScreen = true;
        existingMatch.userChatDetail.unReadCount = 0;
        await existingMatch.save();
      } else {
        existingMatch.matchedUserChatDetail.isInChatScreen = true;
        existingMatch.matchedUserChatDetail.unReadCount = 0;
        await existingMatch.save();
      }
      return respondSuccess(res, null, constValues.StatusCode.OK, { chatId: existingMatch.chatId });
    }
    const newChatID = generateChatId();
    await new UserMatch({ user: id, matchedUser: userID, chatId: newChatID }).save();
    return respondSuccess(res, null, constValues.StatusCode.CREATED, { chatId: newChatID });
  },

  chatDetails: async(req, res, next) => {
    const { id, currentLocation, language } = req.user;
    const { chatId } = req.params;
    const getChatList = await UserMatch.findOne({ chatId });
    if (!getChatList) {
      return respondFailure(res, req.__(localesKeys.global.NOT_FOUND, language));
    }
    if (String(getChatList.user) === String(id)) {
      getChatList.userChatDetail.isInChatScreen = true;
      getChatList.userChatDetail.unReadCount = 0;
    } else {
      getChatList.matchedUserChatDetail.isInChatScreen = true;
      getChatList.matchedUserChatDetail.unReadCount = 0;
    }
    await getChatList.save();
    let otherUserId = getChatList.user;
    if (String(getChatList.user) === String(id)) {
      otherUserId = getChatList.matchedUser;
    }
    const userDetails = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [currentLocation.location.coordinates[0], currentLocation.location.coordinates[1]],
          },
          distanceMultiplier: 0.001,
          distanceField: 'distance',
          key: 'currentLocation.location.coordinates',
        },
      },
      {
        $match: {
          _id: ObjectId(otherUserId),
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          showOnlineStatus: 1,
          onlineStatus: 1,
          distance: 1,
          place: '$currentLocation.place',
          image: { $first: '$galleryImages' },
        },
      },
    ]);
    return respondSuccess(res, null, constValues.StatusCode.OK, userDetails[0]);
  },

  chats: async(req, res, next) => {
    const { id } = req.user;
    const { chatId, skip, limit } = req.params;
    const allChats = await Chat.find({ chatId: chatId, deletedBy: { $ne: id } }).select('chatId senderId isMedia message file isLiked createdAt').sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    return respondSuccess(res, null, constValues.StatusCode.OK, allChats);
  },

  updateChatScreen: async(req, res, next) => {
    const { id, language } = req.user;
    const { chatId } = req.params;
    const getChatList = await UserMatch.findOne({ chatId });
    if (!getChatList) {
      return respondFailure(res, req.__(localesKeys.global.NOT_FOUND, language));
    }
    if (String(getChatList.user) === String(id)) {
      getChatList.userChatDetail.isInChatScreen = false;
      getChatList.userChatDetail.unReadCount = 0;
    } else {
      getChatList.matchedUserChatDetail.isInChatScreen = false;
      getChatList.matchedUserChatDetail.unReadCount = 0;
    }
    await getChatList.save();
    return respondSuccess(res, null);
  },

  deleteChat: async(req, res, next) => {
    const { id, language } = req.user;
    const { chatId } = req.params;
    const getChatList = await UserMatch.findOne({ chatId }).lean();
    if (!getChatList) {
      return respondFailure(res, req.__(localesKeys.global.NOT_FOUND, language));
    }
    let otherUserId = getChatList.user;
    if (String(getChatList.user) === String(id)) {
      otherUserId = getChatList.matchedUser;
    }
    if (getChatList.deletedBy !== '') {
      await UserMatch.deleteOne({ chatId });
      await User.updateOne({ _id: otherUserId }, { $pull: { favoriteChats: chatId } });
    } else {
      await UserMatch.updateOne({ chatId }, { $set: { deletedBy: id } });
      await User.updateOne({ _id: id }, { $pull: { favoriteChats: chatId } });
    }
    await Chat.updateMany({ chatId, deletedBy: '' }, { $set: { deletedBy: id } });
    await Chat.deleteMany({ chatId, deletedBy: otherUserId });
    return respondSuccess(res, null);
  },

};
