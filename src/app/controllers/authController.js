import { createUser, findUserByEmail, generateToken, verifyPassword } from '../services/authService.js';

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

export { register, login, getDrivers };