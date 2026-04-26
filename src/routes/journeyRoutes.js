import express from 'express';
import {
  createJourney,
  getJourneys,
  updateJourney,
  updateJourneyStatus,
  deleteJourney,
} from '../app/controllers/journeyController.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';
import {
  validate,
  journeySchema,
  journeyUpdateSchema,
  journeyStatusSchema,
} from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, isAdmin, validate(journeySchema), createJourney);
router.get('/', authenticateJWT, getJourneys);
router.put('/:id', authenticateJWT, isAdmin, validate(journeyUpdateSchema), updateJourney);
router.put('/:id/status', authenticateJWT, isAdmin, validate(journeyStatusSchema), updateJourneyStatus);
router.delete('/:id', authenticateJWT, isAdmin, deleteJourney);

export default router;