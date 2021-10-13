'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    enReason: { type: String, default: '' },
    deReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('ReportUser', reportUserSchema);
