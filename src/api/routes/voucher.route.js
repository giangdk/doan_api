import { Router } from 'express';
import voucherController from '../controllers/voucher.controller.js';

import { validate } from '../middlewares/validate.js';
import {
  listVouchersValidationRules,
  useVoucherValidationRules
} from '../validations/voucher.validator.js';

const router = Router();

router.route('/').get(listVouchersValidationRules(), validate, voucherController.getListVouchers);

router
  .route('/:id')
  .post(useVoucherValidationRules(), validate, voucherController.useVoucherForOrder);

export default router;
