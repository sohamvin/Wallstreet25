const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per window
  message: "Too many login attempts. Please try again later.",
  headers: true,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 requests per window
  message: "Too many signup attempts. Please try again later.",
  headers: true,
});

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 requests per window
  message: "Too many order attempts. Please try again later.",
  headers: true,
});

module.exports = { loginLimiter, signupLimiter, orderLimiter };
