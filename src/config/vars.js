import path from 'path';
import dotenv from 'dotenv-safe';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  example: path.join(__dirname, '../../.env.example')
});

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  mongo: {
    uri:
      process.env.NODE_ENV === 'development' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI
  },
  redis: {
    uri:
      process.env.REDIS_URI
  },
  jwtSecret: process.env.JWT_SECRET,
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  goong: process.env.GOONG_API_KEY,
  cdnUrl: process.env.CDN_URL,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  s3Url: process.env.S3_URL,
  s3Bucket: process.env.S3_BUCKET_NAME,
  querySecretKey: process.env.QUERY_KEY
};
