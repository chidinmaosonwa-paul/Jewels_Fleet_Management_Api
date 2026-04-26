import 'dotenv/config';
import app from './bootstrap/app.js';
import connectDB from './config/database.js';
import logger from './lib/logger.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

start();