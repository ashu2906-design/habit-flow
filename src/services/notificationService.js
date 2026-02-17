const logger = require('../utils/logger');

/**
 * Send daily reminder to user
 * In a production environment, this would use email, push notifications, etc.
 */
const sendDailyReminder = async (userId, uncompletedHabits) => {
    // This is a placeholder for actual notification implementation
    // In production, integrate with:
    // - Email (nodemailer)
    // - Push notifications (web-push, Firebase)
    // - SMS (Twilio)

    logger.info(`Daily reminder for user ${userId}: ${uncompletedHabits.length} habits pending`);

    // Example email template
    const message = {
        subject: `You have ${uncompletedHabits.length} habits to complete today!`,
        body: `Good morning! Here are your habits for today:\n${uncompletedHabits.map(h => `- ${h.icon} ${h.name}`).join('\n')}`
    };

    return {
        sent: true,
        userId,
        message
    };
};

/**
 * Send streak milestone notification
 */
const notifyMilestone = async (userId, habitName, milestone) => {
    logger.info(`Milestone notification: User ${userId} reached ${milestone} days on ${habitName}`);

    const milestoneMessages = {
        7: "🎉 One week down! You're building momentum!",
        14: "🔥 Two weeks strong! You're on fire!",
        21: "💪 Three weeks! They say 21 days makes a habit!",
        30: "🏆 One month! You're officially a champion!",
        60: "⭐ Two months! Consistency is your superpower!",
        90: "🌟 Three months! You're unstoppable!",
        100: "💯 100 DAYS! Legendary achievement!",
        365: "👑 ONE YEAR! You are a habit master!"
    };

    return {
        sent: true,
        userId,
        message: milestoneMessages[milestone] || `Amazing! ${milestone} days streak!`,
        habitName,
        milestone
    };
};

/**
 * Send accountability partner update
 */
const notifyPartner = async (partnerId, message, type) => {
    logger.info(`Partner notification to ${partnerId}: ${message}`);

    return {
        sent: true,
        partnerId,
        message,
        type
    };
};

/**
 * Send weekly summary email
 */
const sendWeeklySummary = async (email, insights) => {
    logger.info(`Weekly summary for ${email}: ${insights.length} insights`);

    const achievementCount = insights.filter(i => i.type === 'achievement').length;
    const warningCount = insights.filter(i => i.type === 'warning').length;

    return {
        sent: true,
        email,
        summary: {
            achievements: achievementCount,
            areasToImprove: warningCount,
            totalInsights: insights.length
        }
    };
};

module.exports = {
    sendDailyReminder,
    notifyMilestone,
    notifyPartner,
    sendWeeklySummary
};
