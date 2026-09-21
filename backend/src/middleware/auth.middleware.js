import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import redis from '../config/redis.js';
import { errorResponse } from '../utils/apiResponse.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided', 401);
    }

    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      return errorResponse(res, 'Token expired. Please login again', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hirematch-secret');
    const user = await User.findById(decoded._id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please login again', 401);
    }

    console.error('Auth middleware error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
};
