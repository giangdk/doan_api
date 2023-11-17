import { body } from 'express-validator';

const updateProfileRules = () => [
  body('fullName').if(body('fullName').notEmpty()).isString(),
  body('username').if(body('username').notEmpty()).isString(),
  // body('dateOfBirth').if(body('dateOfBirth').notEmpty()).isDate(),
  body('email').if(body('email').notEmpty()).isEmail(),
  body('biography').if(body('biography').notEmpty()).isString(),
  body('gender').if(body('gender').notEmpty()).isString(),
  body('avatar').if(body('avatar').notEmpty()).isURL()
];

const updatePasswordRules = () => [
  body('olderPassword')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('newPassword')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('reNewPassword')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString()
];

const updateRecoverPasswordRules = () => [
  body('newPassword')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('reNewPassword')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString()
];

export { updateProfileRules, updatePasswordRules, updateRecoverPasswordRules };
