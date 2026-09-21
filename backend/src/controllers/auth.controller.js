import User from '../models/user.model.js';
import redis from '../config/redis.js';
import generateOtp from '../utils/generateOtp.js';
import sendEmail from '../utils/sendEmail.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';
import transporter from '../config/nodemailer.js';

export async function sendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 409);
    }

    const otp = generateOtp();
    await redis.setex(`otp:signup:${email}`, 300, JSON.stringify({ otp, verified: false }));

    await sendEmail({
      to: email,
      subject: 'Hirematch - Signup OTP',
      html: `
        <h2>Welcome to Hirematch!</h2>
        <p>Your OTP is <b>${otp}</b></p>
        <p>Valid for 5 minutes.</p>
      `,
    });

    return successResponse(res, 'OTP sent successfully to email', { email }, 200);
  } catch (error) {
    console.error('Send OTP Error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 'Email and OTP are required', 400);
    }

    const data = await redis.get(`otp:signup:${email}`);
    if (!data) {
      return errorResponse(res, 'OTP expired or invalid', 400);
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed.otp !== otp) {
      return errorResponse(res, 'Invalid OTP', 400);
    }

    await redis.setex(`otp:signup:${email}`, 300, JSON.stringify({ otp: parsed.otp, verified: true }));
    return successResponse(res, 'OTP verified successfully', { email }, 200);
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const existingOtp = await redis.get(`otp:signup:${email}`);
    if (!existingOtp) {
      return errorResponse(res, 'No OTP request found. Please request OTP first', 400);
    }

    const otp = generateOtp();
    await redis.setex(`otp:signup:${email}`, 300, JSON.stringify({ otp, verified: false }));

    await sendEmail({
      to: email,
      subject: 'Hirematch - Resend OTP',
      html: `
        <h2>Hirematch OTP</h2>
        <p>Your new OTP is <b>${otp}</b></p>
        <p>Valid for 5 minutes.</p>
      `,
    });

    return successResponse(res, 'OTP resent successfully', { email }, 200);
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg, 400);
    }

    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return errorResponse(res, 'User already exists', 409);
    }

    const otpRecord = await redis.get(`otp:signup:${email}`);
    if (!otpRecord) {
      return errorResponse(res, 'OTP expired. Please request again', 400);
    }

    const parsedRecord = typeof otpRecord === 'string' ? JSON.parse(otpRecord) : otpRecord;
    if (!parsedRecord.verified) {
      return errorResponse(res, 'OTP not verified', 400);
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'candidate',
      
    });

    await redis.del(`otp:signup:${email}`);

    const token = user.generateAuthToken();

    return successResponse(
      res,
      'User registered successfully',
      {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = user.generateAuthToken();

    return successResponse(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await redis.setex(`blacklist:${token}`, 86400, '1');
    }

    return successResponse(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}

export async function getProfile(req, res) {
  try {
    const user = req.user;
    return successResponse(res, 'Profile fetched successfully', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    return errorResponse(res, 'Internal server error', 500);
  }
}