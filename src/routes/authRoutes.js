import express from 'express';
import { register, login } from '../app/controllers/authController.js';
import { validate, userSchema, loginSchema } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/register', validate(userSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;