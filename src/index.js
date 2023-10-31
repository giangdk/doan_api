import { createServer } from 'http';
import { Server } from 'socket.io';
import { authorize } from '@thream/socketio-jwt';
import vars from './config/vars.js';
import logger from './config/logger.js';
import app from './config/express.js';
import mongoose from './config/mongoose.js';

import { connection } from './api/utils/WebSocket.js';

mongoose();

const server = createServer(app);
global.io = new Server(server);
global.io.use(
  authorize({
    secret: vars.jwtSecret
  })
);
global.io.on('connection', connection);

server.listen(vars.port, () => logger.info(`Server started on port ${vars.port} (${vars.env})`));

export default app;
