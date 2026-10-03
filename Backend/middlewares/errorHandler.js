const { ApiError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, err.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  console.error(`💥 [API Error] ${req.method} ${req.originalUrl}:`, error.message);

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
