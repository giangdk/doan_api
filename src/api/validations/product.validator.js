import { body, query, param } from 'express-validator';
import { StockCountry, StockStatus } from '../enums/product.enum.js';
import currencyEnum from '../enums/currency.enum.js';
import productSortEnum from '../enums/productSort.enum.js';
import sortOrderTypeEnum from '../enums/sortOrderType.enum.js';

const getFilterOptionsRules = () => [query('t').isString()];

const productValidationRules = () => [
  body('name')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('currencyUnit').notEmpty().bail().isIn(Object.values(currencyEnum)),
  body('stockCountry').notEmpty().bail().isIn(Object.values(StockCountry)),
  body('stockStatus').notEmpty().bail().isIn(Object.values(StockStatus)),
  body('price')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isInt({ min: 0 }),
  body('discount')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isFloat({ min: 0.0, max: 1.0 }),
  body('quantity')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isInt({ min: 0 }),
  body('sku')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('description')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('firstLevelCat')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId(),
  body('brand')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId(),
  body('images')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isArray(),
  body('images.*').isURL(),
  body('variants').if(body('variants').notEmpty()).bail().isArray(),
  body('variants.*.attributes').if(body('variants.*.attributes').notEmpty()).isArray(),
  body('variantLabel').if(body('variantLebl').notEmpty()).isString(),
  body('attributeLabel').if(body('attributeLabl').notEmpty()).isString(),
  body('status')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
];

const updateProductValidationRules = () => [
  body('name')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('currencyUnit').notEmpty().bail().isIn(Object.values(currencyEnum)),
  body('stockCountry').notEmpty().bail().isIn(Object.values(StockCountry)),
  body('stockStatus').notEmpty().bail().isIn(Object.values(StockStatus)),
  body('price')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isInt({ min: 0 }),
  body('discount')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isFloat({ min: 0.0, max: 1.0 }),
  body('quantity')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isInt({ min: 0 }),
  body('sku')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('description')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('firstLevelCat')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId(),
  body('brand')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId(),
  body('images')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail(),
  body('images.*').isURL(),
  body('variants').notEmpty().bail().isArray(),
  body('variants.*.attributes').if(body('variants.*.attributes').notEmpty()).isArray(),
  body('variantLabel').isString(),
  body('attributeLabel').isString(),
  body('status')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
];

const filterProductValidationRules = () => [
  query('limit').if(query('limit').notEmpty()).isInt({ min: 2 }),
  query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
  query('maxPrice')
    .if(query('maxPrice').notEmpty())
    .isInt({ min: 1 })
    .bail()
    .custom((value, { req }) => {
      const { minPrice } = req.query;
      if (parseInt(minPrice) > parseInt(value)) {
        throw new Error(req.t('invalid.price'));
      }
      return true;
    }),
  query('minPrice').if(query('minPrice').notEmpty()).isInt({ min: 0 }),
  query('location').if(query('location').notEmpty()).isString(),
  query('cat').if(query('cat').notEmpty()).isMongoId(),
  query('sortBy').if(query('sortBy').notEmpty()).isIn(Object.values(productSortEnum)),
  query('order').if(query('order').notEmpty()).isIn(Object.values(sortOrderTypeEnum))
];
export {
  getFilterOptionsRules,
  updateProductValidationRules,
  filterProductValidationRules,
  productValidationRules
};
