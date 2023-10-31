import { body, query, param } from 'express-validator';

const postAddressRules = () => [
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

export { postAddressRules };
