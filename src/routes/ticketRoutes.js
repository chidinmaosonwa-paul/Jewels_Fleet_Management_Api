import express from 'express';
import { bookTicket, cancelTicket, getTickets } from '../app/controllers/ticketController.js';
import { authenticateJWT, isAdmin } from '../app/middlewares/authMiddleware.js';
import { validate, ticketBookSchema } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

router.post('/book', authenticateJWT, validate(ticketBookSchema), bookTicket);
router.put('/:id/cancel', authenticateJWT, cancelTicket);
router.get('/', authenticateJWT, getTickets);

export default router;