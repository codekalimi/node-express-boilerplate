'use strict';

const router = require('express-promise-router')();

// controllers
const userController = require('../../controllers/app/userController');

router.get('/profile', userController.getProfile);
router.get('/liked/:skip/:limit', userController.likedUsers);
router.get('/matched/:skip/:limit', userController.matchedUsers);
router.post('/subscription', userController.subscription);
router.patch('/update/images', userController.updateImages);
router.patch('/update/password', userController.changePassword);
router.patch('/update/description', userController.updateDescription);
router.patch('/update/online', userController.updateOnlineStatus);
router.patch('/update/visibility', userController.updateVisibility);
router.patch('/update/distance', userController.updateDistance);
router.patch('/update/notification', userController.updateNotification);
router.patch('/update/email', userController.updateEmail);
router.post('/sendCode', userController.updatePhoneNumberVerificationCode);
router.post('/verifyCode', userController.updatePhoneNumberVerifyCode);
router.get('/deleteCode', userController.deleteVerificationCode);
router.delete('/delete', userController.deleteUserAccount);

module.exports = router;
