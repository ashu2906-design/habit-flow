const Streak = require('../models/Streak');
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const User = require('../models/User');
const { STREAK_MILESTONES, DEFAULT_FORGIVENESS_LIMIT } = require('../config/constants');
const { startOfDay, subDays, startOfMonth, isSameDay } = require('date-fns');

/**
 * Update streak for a habit
 */
const updateStreak = async (userId, habitId, date, completed) => {
    let streak = await Streak.findOne({ user: userId, habit: habitId });

    if (!streak) {
        streak = await Streak.create({
            user: userId,
            habit: habitId,
            forgivenessResetDate: startOfMonth(new Date())
        });
    }

    const today = startOfDay(date);
    const yesterday = subDays(today, 1);

    if (completed) {
        // Check if this continues the streak
        const continuesStreak = streak.lastCompletedDate &&
            (isSameDay(streak.lastCompletedDate, yesterday) || isSameDay(streak.lastCompletedDate, today));

        if (continuesStreak || !streak.lastCompletedDate) {
            // Continue or start streak
            if (!isSameDay(streak.lastCompletedDate, today)) {
                streak.currentStreak += 1;
            }
        } else {
            // Streak was broken, start new one
            if (streak.currentStreak > 0) {
                streak.streakHistory.push({
                    streak: streak.currentStreak,
                    startDate: streak.streakStartDate,
                    endDate: streak.lastCompletedDate,
                    reason: 'broken'
                });
            }
            streak.currentStreak = 1;
            streak.streakStartDate = today;
        }

        streak.lastCompletedDate = today;

        // Update longest streak
        if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
        }

        // Check for milestones
        const milestone = streak.checkMilestone();
        if (milestone) {
            streak.milestones.push({
                days: milestone,
                achievedDate: new Date()
            });
        }

        // Update user stats
        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.totalCompletions': 1 },
            'stats.longestStreak': Math.max(streak.longestStreak, streak.currentStreak)
        });
    }

    await streak.save();

    return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        milestoneAchieved: streak.milestones.length > 0
            ? streak.milestones[streak.milestones.length - 1]
            : null
    };
};

/**
 * Check if user can use forgiveness
 */
const canUseForgiveness = async (userId, habitId) => {
    const streak = await Streak.findOne({ user: userId, habit: habitId });

    if (!streak) return false;

    // Check if we need to reset forgiveness (monthly)
    const now = new Date();
    if (streak.forgivenessResetDate &&
        startOfMonth(now) > startOfMonth(streak.forgivenessResetDate)) {
        streak.forgivenessUsed = 0;
        streak.forgivenessResetDate = startOfMonth(now);
        await streak.save();
    }

    // Check user's forgiveness mode preference
    const user = await User.findById(userId);
    if (!user.profile.preferences.forgivenessMode) {
        return false;
    }

    return streak.forgivenessUsed < streak.maxForgiveness;
};

/**
 * Apply forgiveness to missed day
 */
const applyForgiveness = async (userId, habitId, logId, reason) => {
    const canForgive = await canUseForgiveness(userId, habitId);

    if (!canForgive) {
        return {
            success: false,
            message: 'No forgiveness remaining this month'
        };
    }

    const streak = await Streak.findOne({ user: userId, habit: habitId });
    streak.forgivenessUsed += 1;
    await streak.save();

    return {
        success: true,
        streak: {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            forgivenessRemaining: streak.maxForgiveness - streak.forgivenessUsed
        }
    };
};

/**
 * Recover a streak (using forgiveness retroactively)
 */
const recoverStreak = async (userId, habitId, date, reason) => {
    const canForgive = await canUseForgiveness(userId, habitId);

    if (!canForgive) {
        return {
            success: false,
            message: 'No forgiveness remaining this month'
        };
    }

    const streak = await Streak.findOne({ user: userId, habit: habitId });

    // Create a forgiven log for the missed day
    await HabitLog.findOneAndUpdate(
        { user: userId, habit: habitId, date: startOfDay(date) },
        {
            $set: {
                isForgiven: true,
                forgivenReason: reason,
                completed: false
            }
        },
        { upsert: true }
    );

    streak.forgivenessUsed += 1;
    await streak.save();

    return {
        success: true,
        streak: {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            forgivenessRemaining: streak.maxForgiveness - streak.forgivenessUsed
        }
    };
};

/**
 * Get recovery options for a habit
 */
const getRecoveryOptions = async (userId, habitId) => {
    const streak = await Streak.findOne({ user: userId, habit: habitId });
    const canForgive = await canUseForgiveness(userId, habitId);

    if (!streak || !canForgive) {
        return {
            canRecover: false,
            suggestions: []
        };
    }

    // Find recent missed days that could be recovered
    const recentLogs = await HabitLog.find({
        user: userId,
        habit: habitId,
        completed: false,
        isForgiven: false,
        date: { $gte: subDays(new Date(), 7) }
    }).sort({ date: -1 });

    return {
        canRecover: recentLogs.length > 0,
        forgivenessRemaining: streak.maxForgiveness - streak.forgivenessUsed,
        suggestions: recentLogs.map(log => ({
            date: log.date,
            reason: 'Apply forgiveness to recover streak'
        }))
    };
};

module.exports = {
    updateStreak,
    canUseForgiveness,
    applyForgiveness,
    recoverStreak,
    getRecoveryOptions
};
