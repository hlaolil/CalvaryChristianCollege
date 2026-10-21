// middleware/rateLimit.js
const { rateLimit } = require('express-rate-limit');

// Renders a friendly page instead of express-rate-limit's plain-text reply
function limiter({ windowMinutes, limit, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      res.status(429).render('error', {
        title: 'Too Many Attempts',
        message: `Too many attempts. Please wait ${windowMinutes} minutes and try again.`
      });
    }
  });
}

module.exports = {
  // Only failed logins (status >= 400) count towards the limit
  loginLimiter: limiter({ windowMinutes: 15, limit: 10, skipSuccessfulRequests: true }),
  registerLimiter: limiter({ windowMinutes: 60, limit: 10 }),
  passwordResetLimiter: limiter({ windowMinutes: 60, limit: 5 }),
  contactLimiter: limiter({ windowMinutes: 60, limit: 5 })
};
