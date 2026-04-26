import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const createUser = async (userData) => {
  //Password hashing is handled by the User model's pre-save hook
  const user = new User(userData);
  await user.save();
  return user;
};

const findUserByEmail = async (email) => {
  return User.findOne({ email }).select('+password');
};

export { generateToken, verifyPassword, createUser, findUserByEmail };