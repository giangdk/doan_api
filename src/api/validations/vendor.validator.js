import { body, query, param } from 'express-validator';

const applyVendorRules = () => [
  body('brandName')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString()
    .custom((value, { req }) => {
      if (value.length > 30 || value.length < 5) {
        throw new Error(req.t('invalid.brand'));
      }
      return true;
    }),
  body('phone')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('fullName')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('fullAddress')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('provinceCode')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('districtCode')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('wardCode')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString()
];

const updateProfileRules = () => [
  body('brandName')
    .if(body('brandName').notEmpty().isString())
    .bail()
    .custom((value, { req }) => {
      if (value.length > 30 || value.length < 5) {
        throw new Error(req.t('invalid.brand'));
      }
      return true;
    }),
  body('description')
    .if(body('description').notEmpty().isString())
    .bail()
    .custom((value, { req }) => {
      if (value.length > 500 || value.length < 50) {
        throw new Error(req.t('invalid.description'));
      }
      return true;
    }),
  body('images').if(body('images').notEmpty()).isArray({ min: 1, max: 5 }),
  body('images.*').isURL()
];

const searchVendorsByTextRules = () => [
  query('t').if(query('t').notEmpty()).isString(),
  query('limit').if(query('limit').notEmpty()).isInt({ min: 1 }),
  query('page').if(query('page').notEmpty()).isInt({ min: 0 })
];

// vendorUpdateOrderRules = () => [body()];

export { applyVendorRules, updateProfileRules, searchVendorsByTextRules };
