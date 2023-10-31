import { body, query, param } from 'express-validator';
import paymentMethodEnum from '../enums/paymentMethod.enum.js';

const createPaymentMethodRules = () => [
  body('cardCode')
    .if(body('cardCode').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
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
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),

  body('type')
    .notEmpty()
    .isIn(Object.values(paymentMethodEnum))
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const putPaymentMethodRules = () => [
  param('id')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) => req.t('invalid.id', { value, location, path }))
];

const updatePaymentMethodRules = () => [
  ...putPaymentMethodRules(),
  body('cardCode')
    .if(body('cardCode').notEmpty())
    .isString()
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),
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
    .withMessage((value, { req, location, path }) => req.t('is.string', { value, location, path })),

  body('type')
    .if(body('type').notEmpty())
    .isIn(Object.values(paymentMethodEnum))
    .withMessage((value, { req, location, path }) =>
      req.t('invalid.type', { value, location, path })
    )
];

export { createPaymentMethodRules, updatePaymentMethodRules, putPaymentMethodRules };
