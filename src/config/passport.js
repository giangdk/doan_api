import jwtStr, { ExtractJwt } from 'passport-jwt';

import vars from './vars.js';

import Account from '../api/models/account.model.js';
import Vendor from '../api/models/vendor.model.js';
import accountTypeEnum from '../api/enums/accountType.enum.js';

const JwtStrategy = jwtStr.Strategy;

const jwtOptions = {
  secretOrKey: vars.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwt = async (payload, done) => {
  try {
    const user = await Account.findById(payload.id).select('_id profile phone type').lean();
    if (!user) return done(null, false);

    if (user.type === accountTypeEnum.VENDOR) {
      const vendor = await Vendor.findOne({ owner: user._id }).select('_id').lean();
      if (vendor) user.vendorId = vendor._id;
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
};

export default new JwtStrategy(jwtOptions, jwt);
