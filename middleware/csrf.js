// middleware/csrf.js
// Synchronizer-token CSRF protection: one random token per session, sent back
// in a hidden `_csrf` field on every form and checked on every unsafe request.
const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function tokensMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

exports.csrfProtection = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  if (SAFE_METHODS.has(req.method)) return next();

  if (!tokensMatch(req.body?._csrf, req.session.csrfToken)) {
    return res.status(403).render('error', {
      title: 'Session Expired',
      message: 'Your session expired or the form was out of date. Please go back, refresh the page and try again.'
    });
  }
  next();
};

exports.tokensMatch = tokensMatch;
