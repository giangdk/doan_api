import passport from 'passport';
import util from 'util';
import accountTypeEnum from '../enums/accountType.enum.js';
import responseStatusEnum from '../enums/responseStatus.enum.js';
import APIError from '../errors/api-error.js';
// import Account from '../models/account.model.js'

const handleJWT = (req, res, next, roles) => async (err, user, info) => {
  const error = err || info;
  const logIn = util.promisify(req.logIn);

  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: responseStatusEnum.UNAUTHORIZE,
    stack: error ? error.stack : undefined
  });

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next(apiError);
  }

  if (roles && !roles.includes(user.type)) {
    apiError.status = responseStatusEnum.UNAUTHORIZE;
    apiError.message = 'Unauthorized';
    return next(apiError);
  }
  if (err || !user) {
    apiError.message = 'Unauthorized';
    return next(apiError);
  }

  req.user = user;

  return next();
};

// eslint-disable-next-line max-len
const authorize =
  (roles = Object.values(accountTypeEnum)) =>
  (req, res, next) =>
    passport.authenticate('jwt', { session: false }, handleJWT(req, res, next, roles))(
      req,
      res,
      next
    );

export { authorize };
