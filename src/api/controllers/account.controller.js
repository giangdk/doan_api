import async from 'async';
import libphone from 'google-libphonenumber';
import bcrypt from 'bcryptjs';
import Response from '../utils/response.js';
import Account from '../models/account.model.js';
import authService from '../services/auth.service.js';
import otpTypeEnum from '../enums/otpType.enum.js';
const { PhoneNumberFormat, PhoneNumberUtil } = libphone;
const phoneUtil = PhoneNumberUtil.getInstance();

export default {
  getMe: async (req, res, next) => {
    try {
      return async
        .parallel({
          account: (cb) => {
            Account.findById(req.user._id).populate({ path: 'vendor', select: 'brandName' }).exec(cb);
          }
        })
        .then((result) => {
          const { account } = result;
          return res.json(
            Response.success({
              account
            })
          );
        });
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },
  updateMe: async (req, res, next) => {
    try {
      const { fullName, dateOfBirth, email, biography, gender, avatar } = req.body;
      console.log("giang updateMe: ")
      let updateProfileQuery = {};
      // if (username != null) {
      //   // const checkExistsUsername = await Account.findOne({ username }).select('username');
      //   // if (checkExistsUsername) return res.json(Response.badRequest(req.t('username.exists')));

      //   const checkUsernameChanged = await Account.findOne({
      //     _id: req.user._id
      //   }).select('username');

      //   if (checkUsernameChanged.authentication.isChanged)
      //     return res.json(Response.badRequest(req.t('username.is.changed')));

      //   updateProfileQuery = {
      //     ...updateProfileQuery,
      //     username,
      //     'authentication.isChanged': true
      //   };
      // }
      if (fullName != null) {
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.fullName': fullName
        };
      }

      if (email != null) {
        // const isExistEmail = await Account.exists({ 'profile.email': email });
        // if (isExistEmail) return res.json(Response.badRequest(req.t('email.is.exists')));
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.email': email
        };
      }

      if (dateOfBirth != null) {
        const myDate = new Date(dateOfBirth);
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.dateOfBirth': myDate
        };
      }

      if (biography != null) {
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.biography': biography
        };
      }

      if (gender != null) {
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.gender': gender
        };
      }

      if (avatar != null) {
        updateProfileQuery = {
          ...updateProfileQuery,
          'profile.avatar': avatar
        };
      }
      console.log("update account:" + updateProfileQuery)
      await Account.updateOne({ _id: req.user._id }, { $set: updateProfileQuery });

      return res.json(Response.success(req.t('profile.updated')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  updatePassword: async (req, res, next) => {
    try {
      const { olderPassword, newPassword, reNewPassword } = req.body;

      const account = await Account.findOne({ _id: req.user._id }).select('+password');

      const checkPassword = await account.passwordMatches(olderPassword);
      if (!checkPassword) return res.json(Response.badRequest(req.t('invalid.password')));

      if (newPassword.trim() !== reNewPassword.trim())
        return res.json(Response.badRequest(req.t('profile.password.dont.match')));

      const hashedPassword = bcrypt.hashSync(reNewPassword, 8);

      await Account.updateOne({ _id: req.user._id }, { $set: { password: hashedPassword } });

      return res.json(Response.success(req.t('profile.password.success')));
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

      const isAccountExists = await Account.exists({ phone: phoneNumber });

      if (!isAccountExists) return res.json(Response.badRequest(req.t('invalid.credentials')));

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

          return res.json(Response.success(req.t('otp.successfully')));
        }
      );
    } catch (err) {
      console.error(err);
      return next(err);
    }
  },

  updatePasswordWidthRecover: async (req, res, next) => {
    try {
      const { newPassword, reNewPassword } = req.body;

      if (newPassword.trim() !== reNewPassword.trim())
        return res.json(Response.badRequest(req.t('repassword.dont.match.new.password')));

      const hashedPassword = bcrypt.hashSync(reNewPassword, 8);

      await Account.updateOne({ _id: req.user._id }, { $set: { password: hashedPassword } });

      return res.json(Response.success(req.t('profile.password.success')));
    } catch (error) {
      console.error(error);
      return next(error);
    }
  },

  logout: (req, res) => {
    try {
      const authToken = req.headers.authorization.split(' ')[1];

      return async.parallel(
        {
          // device: (cb) => {
          //   Device.updateMany({
          //     session: authToken,
          //     account: req.user._id,
          //     active: true,
          //   }, { $set: { active: false } })
          //     .exec(cb);
          // },
        },
        (err) => {
          if (err) return err;

          return res.json(Response.success(authToken));
        }
      );
    } catch (err) {
      console.error(err);
      return err;
    }
  }
};
