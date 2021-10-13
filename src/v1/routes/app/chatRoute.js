'use strict';

const router = require('express-promise-router')();

// controllers
const chatController = require('../../controllers/app/chatController');

router.get('/match/:userID', chatController.createOrGetMatch);
router.get('/:chatId', chatController.chatDetails);
router.get('/:chatId/:skip/:limit', chatController.chats);
router.patch('/:chatId', chatController.updateChatScreen);
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;
