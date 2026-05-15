import express from 'express';
import { register, login, getDrivers, updateUserRole, getUsers, forgotPassword, resetPassword, sendVerification, verifyEmail } from '../app/controllers/authController.js';
import { validate, userSchema, loginSchema } from '../app/middlewares/validationMiddleware.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', validate(userSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/drivers', authenticateJWT, isAdmin, getDrivers);
router.put('/users/:id/role', authenticateJWT, isAdmin, updateUserRole);
router.get('/users', authenticateJWT, isAdmin, getUsers);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-verification', authenticateJWT, sendVerification);
router.get('/verify-email', verifyEmail);
router.post('/verify-all', authenticateJWT, isAdmin, verifyAllUsers);

export default router;