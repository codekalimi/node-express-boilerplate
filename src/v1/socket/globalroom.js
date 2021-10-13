'use strict';

const { normalChatList, favoriteChatList, newMessage, likeMessage, updateOnlineStatus, chatScreenUsers, updateTypingStatus, favoriteChat } = require('../controllers/app/socketController');

module.exports = function(io, Global, _) {

  const clients = new Global();

  io.on('connection', (socket) => {
    console.log('User connected');
    const userUniqId = socket.handshake.query.userId;
    const userUniqUsername = socket.handshake.query.userName;
    const userGlobRoom = socket.handshake.query.userId;
    if (userUniqId !== undefined && userUniqId !== null && userUniqId !== 'NaN' && userUniqId !== 'null') {
      console.log('socketID:', socket.id);
      console.log('userUniqId :', userUniqId);
      console.log('userUniqUsername :', userUniqUsername);
      console.log('userGlobRoom :', userGlobRoom);
      clients.checkSocketIdOfUser(socket.id, userUniqId, userGlobRoom);
    }

    socket.on('globalRoom', (data) => {
      const { userId } = data;
      const room = userId;
      socket.join(room);
      clients.EnterRoom(socket.id, userId, room);
      const nameProp = clients.GetRoomList(room);
      const arr = _.uniqBy(nameProp, 'userId');
      socket.emit('loggedInUser', arr);
    });

    socket.on('sendMessage', async(data) => {
      const { chatId, senderId, receiverId } = data;
      const messageDetails = await newMessage(data);
      if (messageDetails.status) {
        await updateTypingStatus(chatId, receiverId, false);
        const userChatData = await normalChatList(senderId);
        const singleMember = await normalChatList(receiverId);
        const userFavoriteChatData = await favoriteChatList(senderId);
        const singleMemberFavorite = await favoriteChatList(receiverId);
        const receiverSockets = clients.GetUserSocketId(receiverId);
        if (receiverSockets) {
          socket.to(receiverSockets.room).emit('newMessage', messageDetails.data);
          socket.to(receiverSockets.room).emit('userTyping', { chatId: chatId, isTyping: false });
          socket.to(receiverSockets.room).emit('chatList', singleMember);
          socket.to(receiverSockets.room).emit('favoriteChatList', singleMemberFavorite);
        }
        const senderSockets = clients.GetUserSocketId(senderId);
        if (senderSockets) {
          socket.emit('chatList', userChatData);
          socket.emit('favoriteChatList', userFavoriteChatData);
          socket.emit('newMessage', messageDetails.data);
        }
      }
    });

    socket.on('likeMessage', async(data) => {
      const { receiverId } = data;
      const messageDetails = await likeMessage(data);
      if (messageDetails.status) {
        const receiverSockets = clients.GetUserSocketId(receiverId);
        if (receiverSockets) {
          socket.to(receiverSockets.room).emit('newLike', messageDetails.data);
        }
      }
    });

    socket.on('requestChatList', async(data) => {
      const { userId } = data;
      const chatData = await normalChatList(userId);
      socket.emit('chatList', chatData);
    });

    socket.on('requestFavoriteChatList', async(data) => {
      const { userId } = data;
      const favoriteChatData = await favoriteChatList(userId);
      socket.emit('favoriteChatList', favoriteChatData);
    });

    socket.on('favoriteChat', async(data) => {
      const { userId, chatId, status } = data;
      await favoriteChat(userId, chatId, status);
      const chatData = await normalChatList(userId);
      const favoriteChatData = await favoriteChatList(userId);
      socket.emit('chatList', chatData);
      socket.emit('favoriteChatList', favoriteChatData);
    });

    socket.on('online', async function(data) {
      const { senderId, status } = data;
      const room = senderId;
      await updateOnlineStatus(senderId, status);
      if (status) {
        socket.join(room);
        clients.EnterRoom(socket.id, senderId, room);
      } else {
        socket.leave(room);
        clients.RemoveUser(socket.id, senderId);
      }
      const chatScreenUser = await chatScreenUsers(senderId);
      for (const usr of chatScreenUser) {
        const receiverSockets = clients.GetUserSocketId(String(usr.userId));
        if (receiverSockets) {
          socket.to(receiverSockets.room).emit('userOnline', { chatId: usr.chatId, isOnline: status });
        }
      }
      const myNormalChats = await normalChatList(senderId);
      for (const chat of myNormalChats) {
        const userSockets = clients.GetUserSocketId(String(chat.userId));
        if (userSockets) {
          let chatData = await normalChatList(userSockets.userId);
          let favoriteChatData = await favoriteChatList(userSockets.userId);
          socket.to(userSockets.room).emit('chatList', chatData);
          socket.to(userSockets.room).emit('favoriteChatList', favoriteChatData);
        }
      }
      const myFavoriteChats = await favoriteChatList(senderId);
      for (const chat of myFavoriteChats) {
        const userSockets = clients.GetUserSocketId(String(chat.userId));
        if (userSockets) {
          let chatData = await normalChatList(userSockets.userId);
          let favoriteChatData = await favoriteChatList(userSockets.userId);
          socket.to(userSockets.room).emit('chatList', chatData);
          socket.to(userSockets.room).emit('favoriteChatList', favoriteChatData);
        }
      }
    });

    socket.on('typing', async(data) => {
      const { chatId, receiverId, isTyping } = data;
      await updateTypingStatus(chatId, receiverId, isTyping);
      const otherUserChatData = await normalChatList(receiverId);
      const otherUserFavoriteChatData = await favoriteChatList(receiverId);
      const receiverSockets = clients.GetUserSocketId(receiverId);
      if (receiverSockets) {
        socket.to(receiverSockets.room).emit('userTyping', { chatId: chatId, isTyping: isTyping });
        socket.to(receiverSockets.room).emit('chatList', otherUserChatData);
        socket.to(receiverSockets.room).emit('favoriteChatList', otherUserFavoriteChatData);
      }
    });

    socket.on('disconnect', async() => {
      const userId = socket.handshake.query.userId;
      console.log('socketID:', socket.id);
      console.log('userUniqId :', userId);
      console.log('userUniqUsername :', socket.handshake.query.userName);
      console.log('userGlobRoom :', socket.handshake.query.room);
      console.log('User disconnected');
      if (userId !== undefined && userId !== null && userId !== 'NaN' && userId !== 'null') {
        clients.RemoveUser(socket.id, userId);
      }
    });

  });

};
