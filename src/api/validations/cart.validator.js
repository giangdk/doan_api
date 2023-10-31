import { body, query, param } from 'express-validator';

const postAddtoCartRules = () => [
  body('productId')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('amount').notEmpty().isInt(),
  body('selectedVariant')
    .if(body('selectedVariant').notEmpty())
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('selectedAttribute')
    .if(body('selectedAttribute').notEmpty())
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const rebuyRules = () => [
  body('items').isArray(),
  body('items.*').isObject(),
  body('items.*.productId')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('items.*.amount').notEmpty().isInt(),
  body('items.*.selectedVariant')
    .if(body('items.*.selectedVariant').notEmpty())
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('items.*.selectedAttribute')
    .if(body('items.*.selectedAttribute').notEmpty())
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
]

const updateCartRules = () => [
  body('productId')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),
  body('selectedAttribute')
    .if(body('selectedAttribute').notEmpty())
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),

  param('cartId')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const deleteCartRules = () => [
  param('id')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

const deleteManyRules = () => [
  body('cartItems')
    .notEmpty()
    .isArray()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    ),

  body('cartItems.*')
    .notEmpty()
    .isMongoId()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
];

export { postAddtoCartRules, updateCartRules, deleteCartRules, deleteManyRules, rebuyRules };
