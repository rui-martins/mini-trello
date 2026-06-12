export default class AppError extends Error {
  constructor(status = 500, message = 'Internal error', code = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}
