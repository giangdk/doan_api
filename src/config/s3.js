import aws from 'aws-sdk';
import vars from './vars.js';

aws.config.update({
  secretAccessKey: vars.s3SecretKey,
  accessKeyId: vars.s3AccessKey,
  region: 'hn',
  endpoint: 'https://hn.ss.bfcplatform.vn',
  apiVersions: {
    s3: '2006-03-01'
  },
  logger: process.stdout
});

const s3 = new aws.S3();

export default s3;
