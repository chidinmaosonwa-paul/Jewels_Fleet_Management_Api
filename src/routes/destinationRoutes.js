import express from 'express';
import { createDestination, getDestinations, updateDestination, deleteDestination } from '../app/controllers/destinationController.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';
import { validate, destinationSchema, destinationUpdateSchema } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, isAdmin, validate(destinationSchema), createDestination);
router.get('/', authenticateJWT, getDestinations);
router.put('/:id', authenticateJWT, isAdmin, validate(destinationUpdateSchema), updateDestination);
router.delete('/:id', authenticateJWT, isAdmin, deleteDestination);

export default router;