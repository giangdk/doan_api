import bcrypt from 'bcryptjs';
import libphone from 'google-libphonenumber';
import jwt from 'jsonwebtoken';
import Account from '../models/account.model.js';
import Response from '../utils/response.js';
import otpTypeEnum from '../enums/otpType.enum.js';
import authService from '../services/auth.service.js';
import vars from '../../config/vars.js';

const { PhoneNumberFormat, PhoneNumberUtil } = libphone;

const phoneUtil = PhoneNumberUtil.getInstance();

export default {
  loginOtp: async (req, res, next) => {
    try {
      const { phone } = req.body;
      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const isAccountExists = await Account.exists({ phone: phoneNumber });

      if (!isAccountExists) return res.json(Response.badRequest(req.t('invalid.credentials')));

      authService.generateOtpPhone(phone, otpTypeEnum.LOGIN);
      return res.json(Response.success(null, req.t('otp.sent')));
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  registerOTP: async (req, res, next) => {
    try {
      const { phone, fullName } = req.body;
      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const isAccountExists = await Account.exists({ phone: phoneNumber });

      if (isAccountExists)
        return res.json(Response.badRequest(req.t('register.already.exists.phone.number')));

      const account = {
        phone,
        fullName
      };

      authService.generateRegisterOtp(account, otpTypeEnum.REGISTRATION);
      return res.json(Response.success(null, req.t('otp.sent')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  verifyRegisterOTP: (req, res, next) => {
    try {
      const { phone, code } = req.body;
      return authService.verityOTPCode(
        phone,
        code,
        otpTypeEnum.REGISTRATION,
        async (err, verification) => {
          if (err) return next(err);

          const number = phoneUtil.parse(phone, 'VN');
          const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

          const existAccount = await Account.findOne({ phone: phoneNumber });
          if (existAccount)
            return res.json(Response.badRequest(req.t('register.already.exists.phone.number')));

          if (!verification) return res.json(Response.badRequest(req.t('invalid.code')));
          authService.releaseOTPKey(phone, otpTypeEnum.REGISTRATION);
          const account = new Account({
            phone: phoneNumber,
            authentication: {
              isPhoneVerified: true,
              isCreatedPassword: true,
            },
            password: verification.password,
            'profile.fullName': verification.fullName
          });
          await account.save();
          const token = jwt.sign({ id: account._id }, vars.jwtSecret, {
            expiresIn: 86400 * 365
          });

          return res.json(
            Response.success(
              {
                auth: true,
                token,
                userId: account._id,
                account
              },
              req.t('otp.successfully')
            )
          );
        }
      );
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  verifyLoginOTP: async (req, res, next) => {
    try {
      const { phone, code } = req.body;
      return authService.verityOTPCode(
        phone,
        code,
        otpTypeEnum.LOGIN,
        async (err, verification) => {
          if (err) return next(err);

          if (!verification) return res.json(Response.badRequest(req.t('invalid.code')));

          authService.releaseOTPKey(phone, otpTypeEnum.LOGIN);

          const number = phoneUtil.parse(phone, 'VN');
          const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

          const account = await Account.findOne({ phone: phoneNumber });
          if (!account)
            return res.json(Response.badRequest(req.t('login.not.exists.phone.number')));

          const token = jwt.sign({ id: account._id }, vars.jwtSecret, {
            expiresIn: 86400 * 365
          });

          return res.json(
            Response.success({
              auth: true,
              token,
              userId: account._id,
              account
            })
          );
        }
      );
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      const { phone, password, fullName, } = req.body;

      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const existAccount = await Account.findOne({ phone: phoneNumber });

      if (existAccount) return res.json(Response.badRequest(req.t('already.exists.phone.number')));

      const hashedPassword = bcrypt.hashSync(password, 8);

      const account = {
        fullName,
        phone,
        password
      };

      authService.generateOTPCode(account, otpTypeEnum.REGISTRATION);

      return res.json(Response.success(null, req.t('otp.sent')));
    } catch (err) {
      console.log("9");
      console.error(err);
      return next(err);
    }
  },

  login: async (req, res, next) => {

    try {
      const { phone, password } = req.body;

      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNum = phoneUtil.format(number, PhoneNumberFormat.E164);

      const account = await Account.findOne({ phone: phoneNum }).select('+password');

      if (!account) return res.json(Response.badRequest(req.t('login.not.exists.phone.number')));

      if (!account.authentication.isCreatedPassword)
        return res.json(Response.badRequest(req.t('password.is.not.created'), 'isCreatPassword'));
      // const isValidPassword = await account.passwordMatches(password);
      const isValidPassword = password === account.password
      console.log("login6" + isValidPassword)
      if (!isValidPassword) return res.json(Response.badRequest(req.t('invalid.credentials')));
      console.log("login7")
      const token = jwt.sign({ id: account._id }, vars.jwtSecret, {
        expiresIn: 86400 * 365
      });

      return res.json(
        Response.success({
          auth: true,
          token,
          userId: account._id,
          account
        })
      );
    } catch (err) {
      console.log("login8")
      console.error(err);
      return next(err);
    }
  },

  completeProfile: async (req, res, next) => {
    try {
      const { password } = req.body;

      const account = await Account.findById(req.user._id);

      if (!account) return res.json(Response.badRequest(req.t('invalid.credentials')));

      if (!account.authentication.isPhoneVerified)
        return res.json(Response.badRequest(req.t('phone.is.not.verified')));
      const hashedPassword = bcrypt.hashSync(password, 8);

      account.password = hashedPassword;
      account.authentication.isCreatedPassword = true;

      await account.save();
      return res.json(Response.success(req.t('update.successfully')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  recoverPassword: async (req, res, next) => {
    try {
      const { phone } = req.body;
      const number = phoneUtil.parse(phone, 'VN');
      if (!phoneUtil.isValidNumber(number))
        return res.json(Response.badRequest(req.t('invalid.phone.number')));

      const phoneNumber = phoneUtil.format(number, PhoneNumberFormat.E164);

      const isAccountExists = await Account.findOne({ phone: phoneNumber });

      if (!isAccountExists) return res.json(Response.badRequest(req.t('invalid.credentials')));

      if (isAccountExists.authentication.isCreatedPassword === false)
        return res.json(Response.badRequest(req.t('password.is.not.created')));

      authService.generateOTPRecoverPass(phone, otpTypeEnum.RECOVER_PASSWORD);

      return res.json(Response.success(null, req.t('otp.sent')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },
  verifyRecoverPassword: async (req, res, next) => {
    try {
      const { phone, code } = req.body;

      return authService.verityOTPCode(
        phone,
        code,
        otpTypeEnum.RECOVER_PASSWORD,
        async (err, verification) => {
          if (err) return next(err);

          if (!verification) return res.json(Response.badRequest(req.t('invalid.code')));

          authService.releaseOTPKey(phone, otpTypeEnum.RECOVER_PASSWORD);

          const account = await Account.findOne({ phone });

          if (!account) return res.json(Response.badRequest(req.t('invalid.credentials')));

          const token = jwt.sign({ id: account._id }, vars.jwtSecret, {
            expiresIn: 86400 * 365
          });

          return res.json(
            Response.success({
              auth: true,
              token,
              userId: account._id,
              account
            })
          );
        }
      );
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  updatePasswordWidthRecover: async (req, res, next) => {
    try {
      const { password } = req.body;

      const hashedPassword = bcrypt.hashSync(password, 8);

      await Account.updateOne({ _id: req.user._id }, { $set: { password: hashedPassword } });

      return res.json(Response.success(req.t('profile.password.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  }
};
