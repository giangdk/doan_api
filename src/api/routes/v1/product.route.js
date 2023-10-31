import { Router } from 'express';

import product from '../../controllers/product.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  filterProductValidationRules,
  getFilterOptionsRules
} from '../../validations/product.validator.js';

const router = Router();

router
  .route('/search')
  .get(filterProductValidationRules(), validate, product.searchProductsByFilter);

router.route('/filters').get(getFilterOptionsRules(), validate, product.getSearchFiltersByText);

export default router;
