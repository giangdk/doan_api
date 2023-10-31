import { io } from 'socket.io-client'; // eslint-disable-line import/no-extraneous-dependencies

const urlEndpoint = 'https://stage.laka.com.vn';

const socket = io(urlEndpoint, {
  auth: {
    token:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWI1N2RjY2IwYmM0OWQ2MjYzZDJiZCIsImlhdCI6MTYzODE3OTExNCwiZXhwIjoxNjY5NzE1MTE0fQ.h5tes7gO1HCKoCwewlpLZ71E1Jp8iarA-ea3Qj6MEdA'
  }
});

socket.on('connect', () => {
  console.log('connect', socket.id);
});

socket.on('disconnect', () => {
  console.log('disconnected', socket.id);
});

socket.emit('identity');
socket.emit('subcribe', 'XP5SDRZ5B8');

socket.on('orderChanges', (order) => {
  console.log('orderChanges: new order', order);
});
