class AppError extends Error {
  constructor(status = 500, message = 'Internal server error', code = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (Error.captureStackTrace) Error.captureStackTrace(this, AppError);
  }

  toJSON() {
    return { error: this.message };
  }
}

export default AppError;
