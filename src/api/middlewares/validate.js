import { validationResult } from 'express-validator';
import Response from '../utils/response.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    console.log("giang validate");
    return next();
  }
  console.log("giang validate");
  return res.json(Response.validationErrors(errors));
};

export { validate };
