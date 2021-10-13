'use strict';

// node modules
const mongoose = require('mongoose');
const { Schema } = mongoose;

const deleteUserSchema = new Schema(
  {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('DeleteUser', deleteUserSchema);
