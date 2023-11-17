import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import authController from '../../controllers/authentication.controller.js';
import product from '../../controllers/product.controller.js';
import {
  registerValidationRules,
  loginValidationRules,
  registerOtpRules,
  loginOTPValidationRules,
  registerOTPValidationRules,
  createPassword,
  recoverPasswordOTPValidationRules,
  recoverPasswordOtpRules
} from '../../validations/authentication.validator.js';
import { authorize } from '../../middlewares/auth.js';

const router = Router();

router.route('/register').post(registerValidationRules(), validate, authController.register);

router
  .route('/register-otp')
  .post(registerOTPValidationRules(), validate, authController.registerOTP);
router
  .route('/verify-register-otp')
  .post(registerOtpRules(), validate, authController.verifyRegisterOTP);
router
  .route('/create-password')
  .put(authorize(), createPassword(), validate, authController.completeProfile);
router.route('/login').post(loginValidationRules(), validate, authController.login);

router.route('/verify-login-otp').post(registerOtpRules(), validate, authController.verifyLoginOTP);
router.route('/conversation')
  .get(authorize(), product.getConversation)
  .post(authorize(), product.createConversation)
router.route('/conversation/update')
  .post(authorize(), product.updateLastMessageConversation)
router.route('/login-otp').post(loginOTPValidationRules(), validate, authController.loginOtp);

router
  .route('/recover-password')
  .post(recoverPasswordOTPValidationRules(), validate, authController.recoverPassword)
  .put(authorize(), createPassword(), validate, authController.updatePasswordWidthRecover);

router
  .route('/verify-otp-recover-password')
  .post(recoverPasswordOtpRules(), validate, authController.verifyRecoverPassword);

export default router;
