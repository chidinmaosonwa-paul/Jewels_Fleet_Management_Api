import express from 'express';
import { createReport, getReports, generatePassengerManifest } from '../app/controllers/reportController.js';
import { authenticateJWT, isAdmin, isAdminOrDriver } from '../app/middlewares/authMiddleware.js';
import { validate, reportSchema } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

//Drivers and admins can submit and view reports
router.post('/', authenticateJWT, isAdminOrDriver, validate(reportSchema), createReport);
router.get('/', authenticateJWT, isAdminOrDriver, getReports);

//Passenger manifest PDF is admin-only
router.get('/manifest/:journeyId', authenticateJWT, isAdmin, generatePassengerManifest);

export default router;