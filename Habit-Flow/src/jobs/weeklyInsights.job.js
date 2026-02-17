const cron = require('node-cron');
const User = require('../models/User');
const Insight = require('../models/Insight');
const logger = require('../utils/logger');
const { generateWeeklyInsights } = require('../services/insightService');
const { sendWeeklySummary } = require('../services/notificationService');

/**
 * Weekly insights job
 * Runs every Sunday at 8 PM
 * Generates weekly insights for all users
 */
const weeklyInsightsJob = cron.schedule('0 20 * * 0', async () => {
    logger.info('Running weekly insights job...');

    try {
        const users = await User.find({ isActive: true });

        for (const user of users) {
            // Generate insights
            const insights = await generateWeeklyInsights(user._id);

            if (insights.length > 0) {
                // Save insights to database
                await Insight.insertMany(insights);

                // Send weekly summary
                await sendWeeklySummary(user.email, insights);

                logger.info(`Generated ${insights.length} insights for user ${user._id}`);
            }
        }

        logger.info('Weekly insights job completed');
    } catch (error) {
        logger.error('Weekly insights job failed:', error);
    }
}, {
    scheduled: false
});

module.exports = weeklyInsightsJob;
