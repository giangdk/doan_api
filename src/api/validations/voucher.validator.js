import { param, query } from 'express-validator';

import voucherTypeEnum from '../enums/voucherType.enum.js';

const listVouchersValidationRules = () => [
  query('limit').if(query('limit').notEmpty()).isInt({ min: 1 }),
  query('page').if(query('page').notEmpty()).isInt({ min: 0 }),
  query('type').if(query('type').notEmpty()).isIn(Object.values(voucherTypeEnum)),
  query('vendorId').if(query('vendorId').notEmpty()).isString()
];

const useVoucherValidationRules = () => [param('id').isMongoId(), query('orderId').isMongoId()];

export { listVouchersValidationRules, useVoucherValidationRules };
