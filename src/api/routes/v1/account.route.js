import { Router } from 'express';

import account from '../../controllers/account.controller.js';

import { authorize } from '../../middlewares/auth.js';

import {
  updateProfileRules,
  updatePasswordRules,
  updateRecoverPasswordRules
} from '../../validations/account.validator.js';

import { validate } from '../../middlewares/validate.js';

const router = Router();

router
  .route('/me')
  .get(authorize(), account.getMe)
  .put(authorize(), updateProfileRules(), validate, account.updateMe);
router.route('/password').put(authorize(), updatePasswordRules(), validate, account.updatePassword);

router
  .route('/recover-password')
  .post(authorize(), account.recoverPassword)
  .put(authorize(), updateRecoverPasswordRules(), validate, account.updatePasswordWidthRecover);

router.route('/verify-otp').post(authorize(), validate, account.verifyRecoverPassword);

router.route('/logout').get(authorize(), account.logout);

export default router;
