import { body, param } from 'express-validator';

const createReviewValidationRules = () => [
  body('content').notEmpty().bail().isString(),
  param('id').isMongoId(),
  body('rating').notEmpty().bail().isNumeric({ min: 0, max: 5 }),
  body('gallery')
    .if(body('gallery').notEmpty()).isArray(),
  body('gallery.*')
    .if(body('gallery.*').notEmpty()).isURL(),
];

export {
  createReviewValidationRules,
};
