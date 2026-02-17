const cron = require('node-cron');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const logger = require('../utils/logger');
const { sendDailyReminder } = require('../services/notificationService');
const { startOfDay } = require('date-fns');

/**
 * Reminder job
 * Runs every hour
 * Sends reminders to users based on their preferences
 */
const reminderJob = cron.schedule('0 * * * *', async () => {
    const currentHour = new Date().getHours();
    const hourString = currentHour.toString().padStart(2, '0');

    logger.info(`Running reminder job for hour ${hourString}:00...`);

    try {
        // Find users whose reminder time matches current hour
        const users = await User.find({
            isActive: true,
            'profile.preferences.reminderTime': { $regex: `^${hourString}:` }
        });

        for (const user of users) {
            // Get uncompleted habits for today
            const today = startOfDay(new Date());

            const habits = await Habit.find({
                user: user._id,
                isActive: true,
                isPaused: false
            });

            const completedLogs = await HabitLog.find({
                user: user._id,
                date: today,
                completed: true
            });

            const completedHabitIds = completedLogs.map(l => l.habit.toString());
            const uncompletedHabits = habits.filter(
                h => !completedHabitIds.includes(h._id.toString())
            );

            if (uncompletedHabits.length > 0) {
                await sendDailyReminder(user._id, uncompletedHabits);
                logger.info(`Sent reminder to user ${user._id} for ${uncompletedHabits.length} habits`);
            }
        }

        logger.info('Reminder job completed');
    } catch (error) {
        logger.error('Reminder job failed:', error);
    }
}, {
    scheduled: false
});

module.exports = reminderJob;
