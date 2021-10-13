'use strict';

// core modules
const AWS = require('aws-sdk');
const FCM = require('fcm-node');
const nodemailer = require('nodemailer');

module.exports = {

  sendMail: (options) => {
    const transporter = nodemailer.createTransport({
      secure: true,
      requireTLS: true,
      port: 465,
      secured: true,
      SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: process.env.AWS_SES_REGION,
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      }),
    });
    const mailOptions = { from: options.from, to: options.to, subject: options.subject, html: options.content };
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  sendPushNotification: async(options) => {
    const { token, body } = options;
    if (body && token) {
      const message = {
        to: token,
        priority: 'high',
        notification: {
          title: body.title,
          body: body.content,
          sound: 'default',
        },
        data: {
          title: 'Intine',
          body: body,
          sound: 'default',
        },
      };
      const fcmSender = new FCM(process.env.SERVERKEY);
      fcmSender.send(message, (err, response) => {
        if (err) {
          console.log('FCM ERROR : ', err);
          return err;
        }
        console.log('FCM Successfully sent with response: ', response);
        return response;
      });
    }
    return false;
  },

};
