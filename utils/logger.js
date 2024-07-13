// logger.js

import pino from 'pino';
import pinoPretty from 'pino-pretty';

// Initialize pino logger
const logger = pino({
    level: process.env.LOG_LEVEL || 'info'  // Set log level (default: info)
});

// Use pino-pretty for pretty printing in development
if (process.env.NODE_ENV !== 'production') {
    logger.pretty = pinoPretty();
}

export default logger;
