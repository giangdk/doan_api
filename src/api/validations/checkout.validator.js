import { body, param, query } from 'express-validator';
import orderStatusEnum from '../enums/orderStatus.enum.js';
import paymentMethodEnum from '../enums/paymentMethod.enum.js';

const postCheckoutRules = () => [
  body('cartItemIds')
    .notEmpty()
    .isArray()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('cartItemIds.*').isMongoId()
];

const getCheckoutRules = () => [
  query('s').notEmpty().isString().isLength({ min: 1 }),
  query('f').notEmpty().isString().isLength({ min: 32, max: 32 })
];

const preVoucherCheckoutRules = () => [
  ...getCheckoutRules(),
  body('voucherIds')
    .if(body('voucherIds').notEmpty())
    .isArray()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('voucherIds.*')
    .if(body('voucherIds').notEmpty())
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const checkoutRules = () => [
  body('voucherIds')
    .if(body('voucherIds').notEmpty())
    .isArray()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('voucherIds.*')
    .if(body('voucherIds').notEmpty())
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const createCheckoutRules = () => [
  ...checkoutRules(),
  body('address')
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('address.notFound', { value, location, path })
    ),
  body('method').notEmpty().bail().isIn(Object.values(paymentMethodEnum)),
  body('cardCode')
    .if(body('cardCode').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('cardNumber')
    .if(body('cardNumber').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
  body('cardName')
    .if(body('cardName').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),

  body('expirationDate')
    .if(body('expirationDate').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.date', { value, location, path }))
];

const updateStatusOrderRules = () => [
  param('id')
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('invalid.order', { value, location, path })
    )
];

const updateStatusOrderVendorRules = () => [
  ...updateStatusOrderRules(),
  body('status')
    .if(body('status').notEmpty())
    .isIn(Object.values(orderStatusEnum))
    .withMessage((value, { req, location, path }) =>
      req.t('invalid.status', { value, location, path })
    )
];

export {
  preVoucherCheckoutRules,
  postCheckoutRules,
  createCheckoutRules,
  getCheckoutRules,
  updateStatusOrderRules,
  updateStatusOrderVendorRules
};
