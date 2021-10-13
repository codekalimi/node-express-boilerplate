'use strict';

const AWS = require('aws-sdk');

const ReportUser = require('../models/ReportUser');

const s3bucket = new AWS.S3({
  signatureVersion: 'v4',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

module.exports = {

  generateVerificationCode: () => Math.floor(100000 + Math.random() * 900000),

  generatePassword: (len) => {
    const length = (len) || (8);
    const string = 'abcdefghijklmnopqrstuvwxyz';
    const numeric = '0123456789';
    const punctuation = '!@#$%^&*';
    let password = '';
    let character = '';
    while (password.length < length) {
      const entity1 = Math.ceil(string.length * Math.random() * Math.random());
      const entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
      const entity3 = Math.ceil(punctuation.length * Math.random() * Math.random());
      let hold = string.charAt(entity1);
      hold = (password.length % 2 === 0) ? (hold.toUpperCase()) : (hold);
      character += hold;
      character += numeric.charAt(entity2);
      character += punctuation.charAt(entity3);
      password = character;
    }
    password = password.split('').sort(() => {
      return 0.5 - Math.random();
    }).join('');
    return password.substr(0, len);
  },

  getMessageFromValidationError: (error) => {
    const message = error.details[0].message.replace(/\"/g, '');
    const path = error.details[0].path.join().replace(/0,/g, '').replace(/,/g, '.');
    return message + ', PATH: ' + path;
  },

  generateChatId: () => {
    let randSixDigit = Math.floor(100000 + Math.random() * 900000);
    let randStringDigit = Math.random().toString(36).substring(7).toUpperCase();
    return `CHID${randSixDigit}${randStringDigit}`;
  },

  uploadImage: async(file, bucketName, fileName, contentType) => {
    const s3Params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${bucketName}/${fileName}`,
      ContentType: contentType,
      Body: file.data,
      ACL: 'public-read',
    };
    return s3bucket
      .upload(s3Params)
      .promise()
      .then((data) => {
        console.log(data);
        return { status: true, data: data };
      })
      .catch((err) => {
        console.log(err);
        return { status: false, error: err.message };
      });
  },

  uploadCode: async(mainImage, bucketFolder) => {
    let imageName = '';
    const refExt = mainImage.name && mainImage.name.substring(mainImage.name.lastIndexOf('.') + 1, mainImage.name.length);
    const filename = `${new Date().getTime()}.${refExt}`;
    try {
      const uploadRes = await module.exports.uploadImage(mainImage, bucketFolder, filename, mainImage.mimetype);
      if (uploadRes.status) {
        imageName = `${bucketFolder}/${filename}`;
      }
    } catch (err) {
      imageName = '';
    }
    return imageName;
  },

  getReportedUsers: async(userID) => {
    if (userID) {
      const blockedUsers = await ReportUser.find({ reportedBy: userID }).lean();
      return blockedUsers.map(usr => usr.user);
    }
    return [];
  },

};
