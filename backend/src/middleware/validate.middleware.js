import { body, validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }
  return next();
};

export const validateRegister = [
  body('username').trim().isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
  validate,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const validateSendOtp = [
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  validate,
];

export const validateVerifyOtp = [
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];
