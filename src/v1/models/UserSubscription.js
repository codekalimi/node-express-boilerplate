'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, enum: ['FREE', 'BASIC', 'GALAXY'], default: 'FREE' },
    price: { type: Number, default: 0 },
    duration: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
