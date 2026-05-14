import express from 'express';
import { register, login, getDrivers } from '../app/controllers/authController.js';
import { validate, userSchema, loginSchema } from '../app/middlewares/validationMiddleware.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', validate(userSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/drivers', authenticateJWT, isAdmin, getDrivers);

export default router;