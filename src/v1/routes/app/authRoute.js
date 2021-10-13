'use strict';

const passport = require('passport');
const router = require('express-promise-router')();

// controllers
const authController = require('../../controllers/app/authController');

// passport
require('../../helpers/passport');

const requireSignin = passport.authenticate('local', { session: false });
const requireAuth = passport.authenticate('accessTokenAuth', { session: false });
const requireRefreshAuth = passport.authenticate('refreshTokenAuth', { session: false });

router.get('/token', requireRefreshAuth, authController.tokenRefresh);
router.post('/verification/send', authController.sendVerificationCode);
router.post('/verification/verify', authController.verifyCode);
router.post('/register', requireAuth, authController.register);
router.post('/login', requireSignin, authController.signIn);
router.post('/logout', requireAuth, authController.logout);
router.patch('/user/profile/create', requireAuth, authController.saveProfile);

module.exports = router;
