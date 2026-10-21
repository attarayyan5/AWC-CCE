// src/server.js
// Application entrypoint
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './src/config/db.js';
import { config } from './src/config/index.js';
import logger from './src/utils/logger.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const port = config.port;
    app.listen(port, () => {
      logger.info(`Server running in ${config.env} mode on port ${port}`);
      logger.info(`API base: http://localhost:${port}/api/v1`);
      logger.info(`Health check: http://localhost:${port}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { message: error.message });
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', { message: err.message });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message });
  process.exit(1);
});

startServer();
