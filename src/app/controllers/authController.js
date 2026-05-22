import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/emailService.js";
import {
  createUser,
  findUserByEmail,
  generateToken,
  verifyPassword,
} from "../services/authService.js";
import User from "../models/user.js";

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await createUser({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
    });
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await User.findByIdAndUpdate(user._id, { verificationToken });
    await sendVerificationEmail(user.email, verificationToken, user.firstName);
    const token = generateToken(user);
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // if (!user.isVerified) {
    //   return res
    //     .status(403)
    //     .json({ message: "Please verify your email before logging in" });
    // }
    const token = generateToken(user);
    res.json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: "driver" });
    const drivers = await User.find({ role: "driver" }).skip(skip).limit(limit);
    res.json({
      data: drivers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit);
    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user.userId) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: `User role updated to ${role} successfully`, user });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with that email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, resetToken, user.firstName);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    next(error);
  }
};

const sendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "+verificationToken",
    );
    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, verificationToken, user.firstName);
    res.json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token }).select(
      "+verificationToken",
    );
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  getDrivers,
  updateUserRole,
  getUsers,
  forgotPassword,
  resetPassword,
  sendVerification,
  verifyEmail,
};
