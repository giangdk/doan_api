import ResponseStatus from '../enums/responseStatus.enum.js';

export default class Response {
  constructor({ data, status, message, errors }) {
    this.data = data;
    this.status = status;
    this.message = message;
    this.errors = errors;
  }

  static success(data, message) {
    return new Response({
      data,
      status: ResponseStatus.SUCCESS,
      message: message || 'success',
      errors: null
    });
  }

  static error(message, errors) {
    return new Response({
      data: null,
      status: ResponseStatus.ERROR,
      message,
      errors: errors ? [errors] : null
    });
  }

  static validationErrors(errors) {
    return new Response({
      data: null,
      status: ResponseStatus.BAD_REQUEST,
      message: 'Validation Error',
      errors: errors.array()
    });
  }

  static unAuthorized(message) {
    return new Response({
      data: null,
      status: ResponseStatus.UNAUTHORIZE,
      message: message || 'Unauthorized',
      errors: null
    });
  }

  static notFound(message, errors) {
    return new Response({
      data: null,
      status: ResponseStatus.NOT_FOUND,
      message: message || 'Invalid resource',
      errors: errors ? [errors] : null
    });
  }

  static badRequest(message, errors) {
    return new Response({
      data: null,
      status: ResponseStatus.BAD_REQUEST,
      message: message || 'Bad Request',
      errors: errors ? [errors] : null
    });
  }
}
