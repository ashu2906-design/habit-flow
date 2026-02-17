const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const Insight = require('../models/Insight');
const { subDays, startOfDay, getDay, getHours, addDays } = require('date-fns');
const { TIME_SLOTS, DAYS_OF_WEEK } = require('../config/constants');

/**
 * Generate weekly insights for a user
 */
const generateWeeklyInsights = async (userId) => {
    const insights = [];
    const weekAgo = subDays(new Date(), 7);

    // Get user's habits and logs
    const habits = await Habit.find({ user: userId, isActive: true });
    const logs = await HabitLog.find({
        user: userId,
        date: { $gte: weekAgo }
    });

    // Group logs by habit
    const logsByHabit = {};
    logs.forEach(log => {
        const habitId = log.habit.toString();
        if (!logsByHabit[habitId]) logsByHabit[habitId] = [];
        logsByHabit[habitId].push(log);
    });

    for (const habit of habits) {
        const habitLogs = logsByHabit[habit._id.toString()] || [];
        const completedLogs = habitLogs.filter(l => l.completed);
        const successRate = habitLogs.length > 0
            ? (completedLogs.length / habitLogs.length) * 100
            : 0;

        // Generate insight based on performance
        if (successRate >= 85) {
            insights.push({
                user: userId,
                habit: habit._id,
                type: 'achievement',
                title: `Great week for ${habit.name}!`,
                message: `You completed ${habit.name} ${Math.round(successRate)}% of the time this week. Keep it up!`,
                priority: 'low',
                expiresAt: addDays(new Date(), 7)
            });
        } else if (successRate < 40) {
            insights.push({
                user: userId,
                habit: habit._id,
                type: 'warning',
                title: `${habit.name} needs attention`,
                message: `Your completion rate for ${habit.name} was only ${Math.round(successRate)}% this week. Would you like some help?`,
                priority: 'high',
                expiresAt: addDays(new Date(), 7)
            });
        }

        // Detect best time pattern
        const bestTime = detectBestTime(completedLogs);
        if (bestTime.bestTime && bestTime.successRate > 70) {
            insights.push({
                user: userId,
                habit: habit._id,
                type: 'pattern',
                title: 'Best time detected',
                message: `You're most successful with ${habit.name} in the ${bestTime.bestTime}`,
                pattern: {
                    bestTime: bestTime.bestTime,
                    successRate: bestTime.successRate
                },
                priority: 'medium',
                expiresAt: addDays(new Date(), 14)
            });
        }
    }

    // Overall patterns
    const overallPattern = await detectPatterns(userId);
    if (overallPattern.bestDay) {
        insights.push({
            user: userId,
            type: 'tip',
            title: 'Your best day is ' + overallPattern.bestDay,
            message: `You tend to complete more habits on ${overallPattern.bestDay}. Consider scheduling important habits for this day.`,
            priority: 'medium',
            expiresAt: addDays(new Date(), 14)
        });
    }

    return insights;
};

/**
 * Detect patterns for a user (or specific habit)
 */
const detectPatterns = async (userId, habitId = null) => {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const query = {
        user: userId,
        date: { $gte: thirtyDaysAgo },
        completed: true
    };

    if (habitId) query.habit = habitId;

    const logs = await HabitLog.find(query);

    // Aggregate by day of week
    const dayStats = {};
    DAYS_OF_WEEK.forEach(day => {
        dayStats[day] = { total: 0, completed: 0 };
    });

    logs.forEach(log => {
        const dayIndex = getDay(log.date);
        // Adjust to Monday-based week
        const dayName = DAYS_OF_WEEK[(dayIndex + 6) % 7];
        dayStats[dayName].completed += 1;
    });

    // Find best day
    let bestDay = null;
    let maxCompletions = 0;
    for (const [day, stats] of Object.entries(dayStats)) {
        if (stats.completed > maxCompletions) {
            maxCompletions = stats.completed;
            bestDay = day;
        }
    }

    // Analyze time patterns
    const bestTime = detectBestTime(logs);

    // Mood correlations
    const moodStats = {};
    logs.forEach(log => {
        if (log.mood) {
            if (!moodStats[log.mood]) moodStats[log.mood] = 0;
            moodStats[log.mood]++;
        }
    });

    return {
        bestDay,
        bestTime: bestTime.bestTime,
        dayBreakdown: dayStats,
        moodCorrelation: moodStats
    };
};

/**
 * Detect best time of day for habit completion
 */
const detectBestTime = (logs) => {
    const timeSlots = {
        morning: { count: 0, completed: 0 },
        afternoon: { count: 0, completed: 0 },
        evening: { count: 0, completed: 0 },
        night: { count: 0, completed: 0 }
    };

    logs.forEach(log => {
        if (log.completedAt) {
            const hour = getHours(log.completedAt);
            const slot = getTimeSlot(hour);
            timeSlots[slot].count++;
            if (log.completed) {
                timeSlots[slot].completed++;
            }
        }
    });

    let bestSlot = null;
    let highestRate = 0;

    for (const [slot, data] of Object.entries(timeSlots)) {
        if (data.count > 0) {
            const rate = (data.completed / data.count) * 100;
            if (rate > highestRate) {
                highestRate = rate;
                bestSlot = slot;
            }
        }
    }

    return {
        bestTime: bestSlot,
        successRate: Math.round(highestRate)
    };
};

/**
 * Get time slot from hour
 */
const getTimeSlot = (hour) => {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
};

/**
 * Suggest optimal time for a habit
 */
const suggestBestTime = async (userId, habitId) => {
    const logs = await HabitLog.find({
        user: userId,
        habit: habitId,
        completed: true
    }).limit(100);

    const result = detectBestTime(logs);

    return {
        suggestedTime: result.bestTime,
        reason: `You have a ${result.successRate}% success rate in the ${result.bestTime}`,
        confidence: result.successRate > 70 ? 'high' : result.successRate > 50 ? 'medium' : 'low'
    };
};

module.exports = {
    generateWeeklyInsights,
    detectPatterns,
    detectBestTime,
    suggestBestTime
};
