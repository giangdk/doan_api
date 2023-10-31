import express from 'express';
import categoryController from '../../controllers/category.controller.js';
import { validate } from '../../middlewares/validate.js';
import {
  createCategoryRules,
  updateCategoryRules,
  deleteCategoryRules
} from '../../validations/category.validator.js';
import { authorize } from '../../middlewares/auth.js';
import accountTypeEnum from '../../enums/accountType.enum.js';

const router = express.Router();

router
  .route('/')
  .post(
    authorize(accountTypeEnum.ADMIN),
    createCategoryRules(),
    validate,
    categoryController.createCatgory
  )
  .get(categoryController.getCategories);

router
  .route('/:id')
  .put(
    authorize(accountTypeEnum.ADMIN),
    updateCategoryRules(),
    validate,
    categoryController.updateCategory
  )
  .delete(
    authorize(accountTypeEnum.ADMIN),
    deleteCategoryRules(),
    validate,
    categoryController.deleteCategory
  );

router.route('/:id/categories').get(categoryController.getCategoriesbyID);

router.route('/:id/products').get(categoryController.getProductsbyCate);

router.route('/mega').get(categoryController.getMegaCategoty);

router.route('/featured').get(categoryController.getFeaturedCategories);

export default router;
