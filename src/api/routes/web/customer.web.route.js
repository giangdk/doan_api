import { Router } from 'express';
import VendorControler from '../../controllers/vendor.controler.js';
import { applyVendorRules } from '../../validations/vendor.validator.js';
import { validate } from '../../middlewares/validate.js';

const router = Router();

router.route('/apply').post(applyVendorRules(), validate, VendorControler.applyVendor);

export default router;
