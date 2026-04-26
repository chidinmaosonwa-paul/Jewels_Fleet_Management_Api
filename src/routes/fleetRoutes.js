import express from 'express';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from '../app/controllers/fleetController.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';
import { validate, vehicleSchema, vehicleUpdateSchema } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, isAdmin, validate(vehicleSchema), createVehicle);
router.get('/', authenticateJWT, getVehicles);
router.put('/:id', authenticateJWT, isAdmin, validate(vehicleUpdateSchema), updateVehicle);
router.delete('/:id', authenticateJWT, isAdmin, deleteVehicle);

export default router;