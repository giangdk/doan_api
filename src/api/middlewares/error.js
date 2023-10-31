// import expressValidation from 'express-validation'
import httpStatus from 'http-status';
import vars from '../../config/vars.js';
import APIError from '../errors/api-error.js';
import ResponseStatus from '../enums/responseStatus.enum.js';

const handler = (err, req, res, next) => {
  const response = {
    data: null,
    status: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack
  };

  if (vars.env !== 'development') {
    delete response.stack;
  }

  return res.json(response);
};

const converter = (err, req, res, next) => {
  let convertedError = err;

  if (!(err instanceof APIError)) {
    convertedError = new APIError({
      data: null,
      message: err.message,
      status: err.status,
      errors: err.errors,
      stack: err.stack
    });
  }

  return handler(convertedError, req, res);
};

const notFound = (req, res, next) => {
  const err = new APIError({
    // message: 'Not found',
    status: ResponseStatus.NOT_FOUND
  });

  return handler(err, req, res);
};

export default {
  handler,
  converter,
  notFound
};
