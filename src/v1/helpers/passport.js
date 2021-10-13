'use strict';

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local');

// models
const User = require('../models/User');

// helpers
const { respondError } = require('./response');
const constValues = require('./constants');
const localesKeys = require('../../locales/keys.json');


// Create local strategy
const localOptions = { usernameField: 'phoneNumber', passReqToCallback: true };
const localLogin = new LocalStrategy(localOptions, (req, phoneNumber, password, done) => {
  User.findOne({ shortCode: req.body.shortCode, phoneNumber, isVerified: constValues.status.ACTIVE }, (err, user) => {
    if (err) {
      done(respondError(req.__(localesKeys.global.TRY_AGAIN), constValues.StatusCode.INTERNAL_SERVER_ERROR), false);
    }
    if (!user) {
      done(respondError(req.__(localesKeys.auth.PLEASE_REGISTER), constValues.StatusCode.NOT_FOUND), false);
    }

    user.comparePassword(password, (error, isMatch) => {
      if (error) {
        done(respondError(req.__(localesKeys.global.TRY_AGAIN), constValues.StatusCode.INTERNAL_SERVER_ERROR), false);
      }
      if (!isMatch) {
        done(respondError(req.__(localesKeys.auth.WRONG_PASSWORD), constValues.StatusCode.CONFLICT), false);
      }
      if (!user.status) {
        done(respondError(req.__(localesKeys.auth.USER_DEACTIVE), constValues.StatusCode.CONFLICT), false);
      }
      if (user.userType === constValues.userType.ADMIN) {
        done(respondError(req.__(localesKeys.auth.ACCESS_DENIED), constValues.StatusCode.FORBIDDEN), false);
      }
      done(null, user);
    });
  });
});

// Setup options for JWT Strategy
const accessTokenAuthOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
};

const refreshTokenAuthOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_REFRESH_SECRET,
  passReqToCallback: true,
};

// Create JWT strategy
const getJWTStrategy = (options) =>
  new JwtStrategy(options, (req, payload, done) => {
    User.findById(payload.userId, (err, user) => {
      if (err) {
        done(respondError(req.__(localesKeys.global.TRY_AGAIN), constValues.StatusCode.INTERNAL_SERVER_ERROR), false);
      }
      if (user) {
        if (!user.status) {
          done(respondError(req.__(localesKeys.auth.USER_DEACTIVE), constValues.StatusCode.CONFLICT), false);
        }
        user.language = req.language;
        done(null, user);
      } else {
        done(respondError(req.__(localesKeys.auth.PLEASE_LOGIN), constValues.StatusCode.UNAUTHORIZED), false);
      }
    });
  });

// Create JWT strategy
const accessTokenAuth = getJWTStrategy(accessTokenAuthOptions);
const refreshTokenAuth = getJWTStrategy(refreshTokenAuthOptions);

// Tell passport to use this strategy
passport.use(localLogin);
passport.use('accessTokenAuth', accessTokenAuth);
passport.use('refreshTokenAuth', refreshTokenAuth);
