import rateLimit from 'express-rate-limit';

/**
 * Security Middleware Suite (Phase 18)
 * Provides defenses against NoSQL/MongoDB operator injection,
 * brute-force denial-of-service / credential stuffing,
 * and cross-tenant IDOR access vulnerabilities.
 */

/**
 * Strips MongoDB query operators ($gt, $ne, $where, etc.) and dot-notation paths
 * from req.body, req.query, and req.params to prevent NoSQL operator injection.
 */
export const sanitizeMongoInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    const clean = {};
    for (const key of Object.keys(obj)) {
      // Omit keys beginning with '$' or containing '.'
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * General API Rate Limiter
 * Guards against API flooding and resource exhaustion.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Max 500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict Authentication Rate Limiter
 * Protects login and registration routes against credential-stuffing and brute force.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});
