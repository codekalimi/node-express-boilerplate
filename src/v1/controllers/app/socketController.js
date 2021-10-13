'use strict';

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// models
const UserMatch = require('../../models/UserMatch');
const User = require('../../models/User');
const Chat = require('../../models/Chat');

// helpers
const { getMessageFromValidationError } = require('../../helpers/utils');
const { validateNewMessage, validateLikeMessage } = require('../../validators/app/socketValidation');
const { sendPushNotification } = require('../../helpers/notification');
const constants = require('../../helpers/constants');

module.exports = {

  chatList: async(userId, favorite) => {
    const user = await User.findOne({ _id: userId });
    const matchObj = {
      $or: [
        { user: ObjectId(userId) },
        { matchedUser: ObjectId(userId) },
      ],
      deletedBy: { $ne: userId },
      latestMessage: { $ne: '' },
      chatId: { $nin: user.favoriteChats },
    };
    if (favorite) {
      matchObj['chatId'] = { $in: user.favoriteChats };
    }
    const chatList = await UserMatch.aggregate([
      {
        $match: matchObj,
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$user' },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ['$_id', '$$userId'] } },
                  { $expr: { $eq: ['$userType', constants.userType.USER] } },
                  { $expr: { $eq: ['$isVerified', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$isProfileComplete', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$isOnboardingComplete', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$status', constants.status.ACTIVE] } },
                ],
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$matchedUser' },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ['$_id', '$$userId'] } },
                  { $expr: { $eq: ['$status', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$isOnboardingComplete', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$isProfileComplete', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$isVerified', constants.status.ACTIVE] } },
                  { $expr: { $eq: ['$userType', constants.userType.USER] } },
                ],
              },
            },
          ],
          as: 'matchedUser',
        },
      },
      {
        $unwind: '$matchedUser',
      },
      {
        $sort: {
          lastChatOn: -1,
        },
      },
      {
        $addFields: {
          currentYear: { $year: new Date },
          dobYear: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser.DOB.year', else: '$user.DOB.year' } },
        },
      },
      {
        $project: {
          chatId: 1,
          latestMessage: 1,
          lastChatOn: 1,
          userId: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser._id', else: '$user._id' } },
          firstName: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser.firstName', else: '$user.firstName' } },
          lastName: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser.lastName', else: '$user.lastName' } },
          age: { $subtract: [ '$currentYear', '$dobYear' ] },
          showOnlineStatus: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser.showOnlineStatus', else: '$user.showOnlineStatus' } },
          onlineStatus: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$matchedUser.onlineStatus', else: '$user.onlineStatus' } },
          unReadCount: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$userChatDetail.unReadCount', else: '$matchedUserChatDetail.unReadCount' } },
          isTyping: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: '$userChatDetail.isTyping', else: '$matchedUserChatDetail.isTyping' } },
          image: { $cond: { if: { $eq: [ '$user._id', ObjectId(userId) ] }, then: { $first: '$matchedUser.galleryImages' }, else: { $first: '$user.galleryImages' } } },
        },
      },
    ]);
    return chatList;
  },

  normalChatList: async(userId) => {
    const chatList = await module.exports.chatList(userId, false);
    return chatList;
  },

  favoriteChatList: async(userId) => {
    const chatList = await module.exports.chatList(userId, true);
    return chatList;
  },

  newMessage: async(body) => {
    const { chatId, senderId, receiverId, message, isMedia, file } = body;
    const { error } = validateNewMessage(body);
    if (error) {
      console.log('getMessageFromValidationError(error) :', getMessageFromValidationError(error));
      return { status: false };
    }
    const senderDetails = await User.findById(senderId);
    const receiverDetails = await User.findById(receiverId);
    if (!receiverDetails) {
      console.log('Receiver Not found');
      return { status: false };
    }
    const updateLatestMessage = await UserMatch.findOne({ chatId });
    await new Chat({ chatId: chatId, senderId: senderId, receiverId: receiverId, message: message, isMedia: isMedia, file: file }).save();
    await UserMatch.updateOne({ chatId }, { $unset: { deletedBy: 1 } });
    updateLatestMessage.lastChatOn = new Date();
    updateLatestMessage.latestMessage = isMedia ? 'Recording' : message;
    const NotificationDetails = {
      token: receiverDetails.deviceToken,
      body: {
        title: constants.NotificationTitle.chat(receiverDetails.language),
        notificationType: constants.NotificationType.CHAT,
        fromUser: senderId,
        toUser: receiverId,
        action: chatId,
        content: constants.NotificationContent.chat(senderDetails.userName, receiverDetails.language),
      },
    };
    if (String(updateLatestMessage.user) === receiverId && !updateLatestMessage.userChatDetail.isInChatScreen) {
      updateLatestMessage.userChatDetail.unReadCount += 1;
      if (receiverDetails.isChatNotificationEnabled) {
        await sendPushNotification(NotificationDetails);
      }
    } else if (String(updateLatestMessage.matchedUser) === receiverId && !updateLatestMessage.matchedUserChatDetail.isInChatScreen) {
      updateLatestMessage.matchedUserChatDetail.unReadCount += 1;
      if (receiverDetails.isChatNotificationEnabled) {
        await sendPushNotification(NotificationDetails);
      }
    }
    await updateLatestMessage.save();
    const latestMessageDetail = await Chat.findOne({ chatId })
      .select('chatId senderId isMedia message file isLiked createdAt')
      .sort({ createdAt: -1 });
    return { status: true, data: latestMessageDetail };
  },

  likeMessage: async(body) => {
    const { receiverId, messageId, status } = body;
    const { error } = validateLikeMessage(body);
    if (error) {
      console.log('getMessageFromValidationError(error) :', getMessageFromValidationError(error));
      return { status: false };
    }
    const receiverDetails = await User.findById(receiverId);
    if (!receiverDetails) {
      console.log('Receiver Not found');
      return { status: false };
    }
    const messageDetails = await Chat.findOne({ _id: messageId }).select('chatId senderId message isLiked createdAt');
    if (!messageDetails) {
      console.log('Message Not found');
      return { status: false };
    }
    messageDetails.isLiked = status;
    await messageDetails.save();
    return { status: true, data: messageDetails };
  },

  updateOnlineStatus: async(userId, status) => {
    await User.updateOne({ _id: userId }, { $set: { onlineStatus: status } });
  },

  chatScreenUsers: async(userId) => {
    const inScreenUsers = await UserMatch.find({ $or: [ { user: userId }, { matchedUser: userId } ] });
    const filteredUsers = [];
    for (const usr of inScreenUsers) {
      if (String(usr.user) === String(userId)) {
        if (usr.matchedUserChatDetail.isInChatScreen) {
          filteredUsers.push({ chatId: usr.chatId, userId: usr.matchedUser });
        }
      } else {
        if (usr.userChatDetail.isInChatScreen) {
          filteredUsers.push({ chatId: usr.chatId, userId: usr.user });
        }
      }
    }
    return filteredUsers;
  },

  updateTypingStatus: async(chatId, receiverId, isTyping) => {
    const checkChatId = await UserMatch.findOne({ chatId });
    let setObj = { 'matchedUserChatDetail.isTyping': isTyping };
    if (String(checkChatId.user) === String(receiverId)) {
      setObj = { 'userChatDetail.isTyping': isTyping };
    }
    await UserMatch.updateOne({ chatId }, { $set: setObj });
  },

  favoriteChat: async(userId, chatId, status) => {
    let actionObj = { $addToSet: { favoriteChats: chatId } };
    if (!status) {
      actionObj = { $pull: { favoriteChats: chatId } };
    }
    await User.updateOne({ _id: userId }, actionObj);
  },

};
