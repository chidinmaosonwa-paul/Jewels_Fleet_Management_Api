import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message }) => `${level}: ${message}`);

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: combine(timestamp(), winston.format.json()),
    }),
  ],
});

export default logger;