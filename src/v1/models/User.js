'use strict';

// node modules
const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    shortCode: { type: String },
    phoneNumber: { type: String, trim: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    description: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female'] },
    genderInterestedIn: { type: String, enum: ['male', 'female', 'both'] },
    galleryImages: [{ type: String, default: '' }],
    isChildrenRequired: { type: String, enum: ['yes', 'no', 'maybe'] },
    password: { type: String, min: 8 },
    DOB: {
      _id: false,
      day: { type: Number },
      month: { type: Number },
      year: { type: Number },
      hour: { type: Number },
      minute: { type: Number },
      timezone: { type: Number },
    },
    birthPlace: {
      _id: false,
      place: { type: String, default: '' },
      location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere', default: [0, 0] },
      },
    },
    currentLocation: {
      _id: false,
      place: { type: String, default: '' },
      location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere', default: [0, 0] },
      },
    },
    likedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    superLikedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    favoriteChats: [{ type: String }],
    email: { type: String, lowercase: true, trim: true, default: '' },
    verificationCode: { type: Number, default: null },
    language: { type: String, enum: ['en', 'de'], default: 'en' },
    userType: { type: Number, default: 1 },
    loginType: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    onlineStatus: { type: Boolean, default: true },
    hideProfile: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    isOnboardingComplete: { type: Boolean, default: false },
    isChatNotificationEnabled: { type: Boolean, default: true },
    isLikeNotificationEnabled: { type: Boolean, default: true },
    isSuperLikeNotificationEnabled: { type: Boolean, default: true },
    isMatchNotificationEnabled: { type: Boolean, default: true },
    deviceToken: { type: String, default: null },
    astroProfile: [{
      _id: false,
      questionId: { type: Schema.Types.ObjectId, ref: 'QnA' },
      answerId: { type: Schema.Types.ObjectId, ref: 'QnA.answers' },
    }],
    qna: [{
      _id: false,
      questionId: { type: Schema.Types.ObjectId, ref: 'QnA' },
      answers: [{ type: Schema.Types.ObjectId, ref: 'QnA.answers' }],
      answerData: [
        {
          englishCategoryName: { type: String, default: '' },
          germanCategoryName: { type: String, default: '' },
          englishAnswer: { type: String, default: '' },
          germanAnswer: { type: String, default: '' },
          englishDescription: { type: String, default: '' },
          germanDescription: { type: String, default: '' },
        },
      ],
    }],
    newPhoneNumber: { type: String, trim: true },
    deleteVerificationCode: { type: Number, default: null },
    activePackage: { type: String, enum: ['FREE', 'BASIC', 'GALAXY'], default: 'FREE' },
    maxDistance: { type: Number, default: 10 },
    likes: { type: Number, default: 0 },
    superLikes: { type: Number, default: 0 },
    packageExpiry: { type: Date, default: new Date },
  },
  {
    timestamps: true,
  },
);

// do not return password
userSchema.set('toJSON', {
  transform(doc, ret, opt) {
    delete ret['password'];
    return ret;
  },
});

// on save hook
userSchema.pre('save', function(next) {
  const user = this;
  if (!this.isModified('password')) {
    console.log('password not modified');
    return next();
  }
  console.log('password modified');
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (error, hash) => {
      if (error) { return next(error); }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) { return callback(err); }
    callback(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);
