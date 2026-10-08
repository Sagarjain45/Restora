import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.',
        code: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
        code: 'INVALID_TOKEN',
      });
    }

    // Attach authenticated identity to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      restaurantId: decoded.restaurantId || null,
      name: decoded.name,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication verification failed.',
      code: 'AUTH_ERROR',
    });
  }
};
