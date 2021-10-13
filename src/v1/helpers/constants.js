'use strict';

module.exports = {

  logger: {
    log: (message) => {
      console.log(message);
    },
  },

  status: {
    ACTIVE: true,
    DEACTIVE: false,
  },

  userType: {
    USER: 1,
    ADMIN: 2,
  },

  loginType: {
    PHONENUMBER: 1,
    EMAIL: 2,
  },

  NotificationTitle: {

    chat: (language) => {
      if (language === 'en') {
        return 'New message';
      }
      return 'Neue Nachricht';
    },

  },

  NotificationType: {
    CHAT: 'CHAT',
  },

  NotificationContent: {

    chat: (username, language) => {
      if (language === 'en') {
        return `New message from ${username}`;
      }
      return `Neue Nachricht von ${username}`;
    },

  },

  emailSubject: {

    emailVerification: (language) => {
      if (language === 'de') {
        return 'Bestätigung Code';
      }
      return 'Confirmation Code';
    },

    forgotPassword: (language) => {
      if (language === 'de') {
        return 'Neues Passwort';
      }
      return 'New Password';
    },

    passwordChange: (language) => {
      if (language === 'de') {
        return 'Passwortänderung';
      }
      return 'Password Change';
    },

  },

  emailContent: {

    emailVerification: (verificationCode, language) => {
      if (language === 'de') {
        return `
          <p>Hier ist dein Bestätigungs Code: <b>${verificationCode}</b> für WakeMate</p>
          <br/>
          <p>Grüße,</p>
          <p><b>Team WakeMate</b></p>
        `;
      }
      return `
          <p>Here is your Confirmation Code: <b>${verificationCode}</b> for WakeMate</p>
          <br/>
          <p>Regards,</p>
          <p><b>Team WakeMate</b></p>
        `;
    },

    forgotPassword: (password, language) => {
      if (language === 'de') {
        return `
          <p>Hier kommt dein neues Passwort: <b>${password}</b>. Es ist nur 1 x zu nutzen.</p>
          <br/>
          <p>Grüße,</p>
          <p><b>Team WakeMate</b></p>
        `;
      }
      return `
          <p>Here is your new password: <b>${password}</b>. It can only be used once.</p>
          <br/>
          <p>Regards,</p>
          <p><b>Team WakeMate</b></p>
        `;
    },

    passwordChange: (language) => {
      if (language === 'de') {
        return '<p>Ihr Passwort wurde erfolgreich geändert.</p><br/><p>Grüße,</p><p><b>Team WakeMate</b></p>';
      }
      return '<p>Your password has been changed successfully.</p><br/><p>Regards,</p><p><b>Team WakeMate</b></p>';
    },

  },

  smsContent: {

    smsVerification: (verificationCode, language) => {
      if (language === 'de'){
        return `Ihr Verifizierungscode lautet: ${verificationCode}.`;
      }
      return `your verification otp is : ${verificationCode}.`;
    },

    forgotPassword: (password) => {
      return `your password is : ${password}.`;
    },

  },

  StatusCode: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

};
