import Account from '../models/account.model.js';

let users = [];

const connection = (client) => {
  client.on('disconnect', () => {
    users = users.filter((user) => user.socketId !== client.id);
  });
  // add identity of user mapped to the socket id
  client.on('identity', async (deviceId) => {
    const user = await Account.findById(client.decodedToken.id).select('_id profile phone type');
    if (!user) {
      global.io.emit('identity', {
        data: { auth: false },
        message: 'Invalid credentials!',
        status: 400,
        errors: null
      });
      return client.disconnect();
    }
    return users.push({
      deviceId,
      socketId: client.id,
      userId: user._id,
      user
    });
  });

  client.on('subcribe', (room) => {
    client.join(room);
  });

  client.on('unsubcribe', (room) => {
    client.leave(room);
  });
};
const onlineDeviceIdsInRoom = (roomId) => {
  const joinedSocket = global.io.sockets.adapter.rooms.get(roomId);
  const joinedSocketIds = Array.from(joinedSocket || []);
  const onlineDeviceIds = users
    .filter((x) => joinedSocketIds.includes(x.socketId) && x.deviceId != null)
    .map((x) => x.deviceId);
  return onlineDeviceIds;
};

export { connection, onlineDeviceIdsInRoom };
