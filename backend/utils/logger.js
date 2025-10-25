// backend/utils/logger.js
import { createLogger, format, transports } from "winston";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.warn('Failed to create logs directory:', error.message);
  }
}

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json()
);

// Create transports array
const logTransports = [
  // Console transport (always available)
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  }),
];

// Add file transports only if logs directory exists
if (fs.existsSync(logsDir)) {
  logTransports.push(
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: "error",
    })
  );
}

// Create Winston logger
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: logTransports,
  // Handle exceptions and rejections gracefully
  exceptionHandlers: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  ],
  rejectionHandlers: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  ]
});

// Export logger as default
export default logger;
