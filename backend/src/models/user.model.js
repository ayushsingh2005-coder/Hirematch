import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      minlength: 4,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
      select: false,
    },
    verifyOtp: {
      type: String,
      default: '',
    },
    verifyOtpExpireAt: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetOtp: {
      type: String,
      default: '',
    },
    resetOtpExpireAt: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter'],
      default: 'candidate',
    },
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.JWT_SECRET || 'hirematch-secret',
    { expiresIn: '24h' }
  );
};

// function for hash the password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});



userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;