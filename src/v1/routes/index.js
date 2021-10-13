'use strict';
const express = require('express');
const app = express();
const passport = require('passport');
const path = require('path');
const { I18n } = require('i18n');

// passport
require('../helpers/passport');

// locales
const i18n = new I18n({
  locales: ['en', 'de'],
  directory: path.join(__dirname, '../../locales'),
});

app.use(i18n.init);

// middleware requireAuth
const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

// routes
const appAuthRoute = require('./app/authRoute');
const appUserRoute = require('./app/userRoute');
const appChatRoute = require('./app/chatRoute');

// app routes
app.use('/app/auth', appAuthRoute); // app auth Route
app.use('/app/user', requireAuth, appUserRoute); // app user Route
app.use('/app/chats', requireAuth, appChatRoute); // app chat Route

// default route
app.use('/', (req, res, next) => { res.send({ success: true, message: 'Gretings From Intine.' }); }); // default Route

module.exports = app;
