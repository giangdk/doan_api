import { body } from 'express-validator';

const registerValidationRules = () => [
  body('fullName')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('password')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

const createPassword = () => [
  body('password')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

const registerOTPValidationRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('fullName')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString()
];

const loginValidationRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('password')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

const registerOtpRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('code')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

const loginOTPValidationRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

const recoverPasswordOTPValidationRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];
const recoverPasswordOtpRules = () => [
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('code')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .custom((value) => !/\s/.test(value))
    .withMessage((value, { req, location, path }) => req.t('no.space', { value, location, path }))
    .bail()
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path }))
];

export {
  loginOTPValidationRules,
  registerValidationRules,
  registerOtpRules,
  loginValidationRules,
  registerOTPValidationRules,
  createPassword,
  recoverPasswordOTPValidationRules,
  recoverPasswordOtpRules
};
