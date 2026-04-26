import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import config from '../config/app.js';
import errorMiddleware from '../app/middlewares/errorHandlerMiddleware.js';
import authRoutes from '../routes/authRoutes.js';
import fleetRoutes from '../routes/fleetRoutes.js';
import destinationRoutes from '../routes/destinationRoutes.js';
import journeyRoutes from '../routes/journeyRoutes.js';
import ticketRoutes from '../routes/ticketRoutes.js';
import reportRoutes from '../routes/reportRoutes.js';
import financialRoutes from '../routes/financialRoutes.js';

const app = express();

app.use(cors({ origin: config.allowedOrigins }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/financial', financialRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use(errorMiddleware);

export default app;