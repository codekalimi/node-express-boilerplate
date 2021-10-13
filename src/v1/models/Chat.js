'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSchema = new Schema(
  {
    chatId: { type: String, default: '' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, default: '' },
    file: { type: String, default: '' },
    isLiked: { type: Boolean, default: false },
    isMedia: { type: Boolean, default: false },
    deletedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Chat', ChatSchema);
