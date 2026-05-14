import { createUser, findUserByEmail, generateToken, verifyPassword } from '../services/authService.js';
import User from '../models/user.js';

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await createUser({ firstName, lastName, email, phone, password, role });
    const token = generateToken(user);
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ message: 'Login successful', token });
  } catch (error) {
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: 'driver' });
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ['user', 'admin'] } });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: `User role updated to ${role} successfully`, user });
  } catch (error) {
    next(error);
  }
};

export { register, login, getDrivers, updateUserRole, getUsers };