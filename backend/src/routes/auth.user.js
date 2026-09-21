import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  register,
  login,
  logout,
  getProfile,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
} from '../middleware/validate.middleware.js';

const authRoute = Router();

authRoute.post('/send-otp', validateSendOtp, sendOtp);
authRoute.post('/verify-otp', validateVerifyOtp, verifyOtp);
authRoute.post('/register', validateRegister, register);
authRoute.post('/resend-otp', validateSendOtp, resendOtp);
authRoute.post('/login', validateLogin, login);
authRoute.post('/logout', authMiddleware, logout);
authRoute.get('/profile', authMiddleware, getProfile);

export default authRoute;