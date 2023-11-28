import Redis from 'redis';
import OtpGenerator from 'otp-generator';
import otpTypeEnum from '../enums/otpType.enum.js';
import vars from '../../config/vars.js';

const redisClient = Redis.createClient({ url: vars.redis.uri });

const Service = {
  generateRegisterOtp(account, prefix = otpTypeEnum.LOGIN) {
    const activationCode = OtpGenerator.generate(4, {
      alphabets: false,
      upperCase: false,
      specialChars: false
    });
    const testCode = '1111';
    redisClient.hmset(
      `${prefix}-${account.phone}`,
      'code',
      testCode,
      'phone',
      account.phone,
      'fullName',
      account.fullName,
      Redis.print
    );
    return activationCode;
  },

  generateOtpPhone(phone, prefix = otpTypeEnum.LOGIN) {
    const activationCode = OtpGenerator.generate(4, {
      alphabets: false,
      upperCase: false,
      specialChars: false
    });
    const testCode = '1111';
    redisClient.hmset(`${prefix}-${phone}`, 'code', testCode, 'phone', phone, Redis.print);
    return activationCode;
  },

  generateOTPCode(account, prefix = otpTypeEnum.REGISTRATION) {
    const activationCode = OtpGenerator.generate(4, {
      alphabets: false,
      upperCase: false,
      specialChars: false
    });
    const testCode = '1111';
    redisClient.hmset(
      `${prefix}-${account.phone}`,
      'code',
      testCode,
      'phone',
      account.phone,
      'fullName',
      account.fullName,
      'password',
      account.password,
      Redis.print
    );
    return activationCode;
  },

  generateOTPRecoverPass(phone, prefix = otpTypeEnum.RECOVER_PASSWORD) {
    const activationCode = OtpGenerator.generate(4, {
      alphabets: false,
      upperCase: false,
      specialChars: false
    });
    const testCode = '1111';
    redisClient.hmset(`${prefix}-${phone}`, 'code', testCode, 'phone', phone, Redis.print);
    return activationCode;
  },

  verityOTPCode(phone, code, prefix, cb) {
    redisClient.hgetall(`${prefix}-${phone}`, (err, result) => {
      if (err || !result) return cb(err, null);
      if (code !== result.code) return cb(err, null);

      return cb(err, result);
    });
  },

  releaseOTPKey(phone, prefix) {
    redisClient.del(`${prefix}-${phone}`);
    // redisClient.expireat;
  }
};

export default Service;
