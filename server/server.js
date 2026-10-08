import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';

const startServer = () => {
  // Start HTTP Server immediately
  const server = app.listen(env.PORT, () => {
    console.log(`[Restora Server] Running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
    // Initiate DB connection asynchronously
    connectDB();
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[Restora Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Restora Server] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
