import mongoose from 'mongoose';
import logger from './logger.js';
import vars from './vars.js';

mongoose.Promise = Promise;

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

if (vars.env === 'development') {
  mongoose.set('debug', true);
}

const connect = () => {
  mongoose
    .connect(vars.mongo.uri, {
      keepAlive: 1
    })
    .then(() => console.log('mongoDB connected...'));
  return mongoose.connection;
};

export default connect;
