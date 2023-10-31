import ExtendableError from './extandable-error.js';
import ResponseStatus from '../enums/responseStatus.enum.js';

class APIError extends ExtendableError {
  constructor({ data, message, errors, stack, status = ResponseStatus.ERROR }) {
    super({
      data,
      message,
      errors,
      status,
      stack
    });
  }
}

export default APIError;
