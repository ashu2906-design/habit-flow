require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

// Initialize cron jobs
if (process.env.ENABLE_CRON_JOBS === 'true') {
  require('./src/jobs/dailyCheckIn.job');
  require('./src/jobs/weeklyInsights.job');
  require('./src/jobs/reminder.job');
  logger.info('Cron jobs initialized');
}

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`🚀 HabitFlow API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
