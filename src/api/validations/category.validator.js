import { body, param } from 'express-validator';

const createCategoryRules = () => [
  body('name')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isString(),
  body('featuredImage').if(body('featuredImage').notEmpty()).isURL(),
  body('firstLevel').if(body('firstLevel').notEmpty()).isMongoId(),
  body('secondLevel').if(body('secondLevel').notEmpty()).isMongoId()
];
const updateCategoryRules = () => [
  param('id')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId(),
  body('featuredImage').if(body('featuredImage').notEmpty()).isURL(),
  body('firstLevel').if(body('firstLevel').notEmpty()).isMongoId(),
  body('secondLevel').if(body('secondLevel').notEmpty()).isMongoId()
];
const deleteCategoryRules = () => [
  param('id')
    .notEmpty()
    .withMessage((value, { req, location, path }) =>
      req.t('is.required', { value, location, path })
    )
    .bail()
    .isMongoId()
];
export { createCategoryRules, updateCategoryRules, deleteCategoryRules };
