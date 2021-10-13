'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserMatchSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    matchedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    chatId: { type: String, default: '' },
    deletedBy: { type: String, default: '' },
    latestMessage: { type: String, default: '' },
    lastChatOn: { type: Date, default: new Date },
    userChatDetail: {
      _id: false,
      isInChatScreen: { type: Boolean, default: true },
      unReadCount: { type: Number, default: 0 },
      isTyping: { type: Boolean, default: false },
    },
    matchedUserChatDetail: {
      _id: false,
      isInChatScreen: { type: Boolean, default: false },
      unReadCount: { type: Number, default: 0 },
      isTyping: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('UserMatch', UserMatchSchema);
