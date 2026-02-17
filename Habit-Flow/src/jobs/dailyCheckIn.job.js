const cron = require('node-cron');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const Streak = require('../models/Streak');
const logger = require('../utils/logger');
const { startOfDay, subDays } = require('date-fns');

/**
 * Daily check-in job
 * Runs every day at midnight
 * Checks for missed habits and updates streaks
 */
const dailyCheckInJob = cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily check-in job...');

    try {
        const users = await User.find({ isActive: true });
        const yesterday = startOfDay(subDays(new Date(), 1));

        for (const user of users) {
            // Get all active habits for user
            const habits = await Habit.find({
                user: user._id,
                isActive: true,
                isPaused: false
            });

            for (const habit of habits) {
                // Check if habit was completed yesterday
                const log = await HabitLog.findOne({
                    user: user._id,
                    habit: habit._id,
                    date: yesterday
                });

                const wasCompleted = log?.completed || log?.isForgiven;

                if (!wasCompleted) {
                    // Handle missed habit
                    await handleMissedHabit(user._id, habit._id, yesterday);
                }
            }
        }

        logger.info('Daily check-in job completed');
    } catch (error) {
        logger.error('Daily check-in job failed:', error);
    }
}, {
    scheduled: false // Will be started in server.js based on env
});

/**
 * Handle a missed habit - update streak
 */
async function handleMissedHabit(userId, habitId, date) {
    const streak = await Streak.findOne({ user: userId, habit: habitId });

    if (!streak || streak.currentStreak === 0) return;

    // Check user's forgiveness mode
    const user = await User.findById(userId);
    const canForgive = user.profile.preferences.forgivenessMode &&
        streak.forgivenessUsed < streak.maxForgiveness;

    if (!canForgive) {
        // Break the streak
        streak.streakHistory.push({
            streak: streak.currentStreak,
            startDate: streak.streakStartDate,
            endDate: streak.lastCompletedDate,
            reason: 'broken'
        });
        streak.currentStreak = 0;
        streak.streakStartDate = null;
        await streak.save();

        // Update habit stats
        await Habit.findByIdAndUpdate(habitId, {
            'stats.currentStreak': 0
        });

        logger.info(`Streak broken for habit ${habitId} - user ${userId}`);
    }

    // Create a log entry for the missed day
    await HabitLog.findOneAndUpdate(
        { user: userId, habit: habitId, date },
        { $setOnInsert: { completed: false } },
        { upsert: true }
    );
}

module.exports = dailyCheckInJob;
