import winston from 'winston';
import path from 'path';
import fs from 'fs';

export interface LoggerOptions {
  logDir?: string;
  logLevel?: string;
  service?: string;
}

export function createLogger(options: LoggerOptions = {}): winston.Logger {
  const logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
  const service = options.service || 'deeprepo-core';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `[${timestamp}] [${level}] [${service}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`,
        ),
      ),
    }),
  ];

  if (options.logDir) {
    if (!fs.existsSync(options.logDir)) {
      fs.mkdirSync(options.logDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: path.join(options.logDir, 'errors.log'),
        level: 'error',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.File({
        filename: path.join(options.logDir, 'indexing.log'),
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    );
  }

  return winston.createLogger({
    level: logLevel,
    defaultMeta: { service },
    transports,
  });
}

export const logger = createLogger();
