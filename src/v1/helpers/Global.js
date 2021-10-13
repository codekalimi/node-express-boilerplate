'use strict';

class Global {

  constructor() {
    this.globalRoom = [];
  }

  checkSocketIdOfUser(socketId, userId, room) {
    console.log('Check socket hit', this.globalRoom);
    const roomDetail = { id: socketId, userId, room };
    const checkSocket = this.globalRoom.map(function(item) { return item.userId; }).indexOf(userId);
    if (checkSocket !== -1) {
      console.log('Inside replace', this.globalRoom[checkSocket].id, socketId);
      if (this.globalRoom[checkSocket].id !== socketId) {
        console.log('SocketId replaced');
        this.globalRoom[checkSocket].id = socketId;
      }
    } else {
      console.log('User pushed to room');
      this.globalRoom.push(roomDetail);
    }
    return checkSocket;
  }

  EnterRoom(id, userId, room) {
    var roomDetail = { id, userId, room };
    var checkSocket = this.globalRoom.map(function(item) { return item.userId; }).indexOf(userId);
    if (checkSocket === -1) {
      this.globalRoom.push(roomDetail);
    }
    return roomDetail;
  }

  RemoveUser(id, userId) {
    let temp = [];
    var userDetail = this.GetUser(id);
    if (userDetail) {
      temp = this.globalRoom.filter((user) => user.id !== id);
      var removeIndex = this.globalRoom.map(function(item) { return item.userId; }).indexOf(userId);
      if (removeIndex !== -1) {
        this.globalRoom.splice(removeIndex, 1);
      }
    }
    return temp;
  }

  GetUser(id) {
    var getUser = this.globalRoom.filter((user) => {
      return user.id === id;
    })[0];
    return getUser;
  }

  GetUserSocketId(userId) {
    var getUser = this.globalRoom.filter((room) => {
      return room.userId === userId;
    })[0];
    return getUser;
  }

  GetRoomList(room) {
    var roomName = this.globalRoom.filter((user) => user.room === room);
    return roomName;
  }

}

module.exports = { Global };
