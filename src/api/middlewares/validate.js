import { validationResult } from 'express-validator';
import Response from '../utils/response.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.json(Response.validationErrors(errors));
};

export { validate };
