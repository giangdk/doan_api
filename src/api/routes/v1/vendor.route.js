import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authorize } from '../../middlewares/auth.js';
import vendor from '../../controllers/vendor.controler.js';
import product from '../../controllers/product.controller.js';

import {
  applyVendorRules,
  searchVendorsByTextRules,
  updateProfileRules
} from '../../validations/vendor.validator.js';
import accountTypeEnum from '../../enums/accountType.enum.js';

const router = Router();

router
  .route('/profile')
  .get(authorize(accountTypeEnum.VENDOR), validate, vendor.getProfile)
  .put(authorize(accountTypeEnum.VENDOR), updateProfileRules(), validate, vendor.updateProfile);

router
  .route('/apply')
  .post(authorize(accountTypeEnum.CUSTOMER), applyVendorRules(), validate, vendor.applyVendor);
router
  .route('/create-livestream')
  .post(vendor.createLiveStream);
router
  .route('/update-livestream')
  .post(vendor.updateLiveStream);
router
  .route('/get-livestream')
  .get(vendor.getListLiveStream);
router.get('/brands', vendor.getBrand);
router.route('/search').get(searchVendorsByTextRules(), validate, vendor.searchByText);
router.route("/create-product").post(authorize(accountTypeEnum.VENDOR), product.createProduct)
export default router;
