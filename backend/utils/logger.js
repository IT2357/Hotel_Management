// backend/utils/logger.js
import { createLogger, format, transports } from "winston";

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json()
);

// Create Winston logger
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    // File transport for all logs
    new transports.File({
      filename: "logs/combined.log",
    }),
    // File transport for error logs
    new transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});

// Export logger as default
export default logger;
