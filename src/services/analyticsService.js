const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const Streak = require('../models/Streak');
const { subDays, subMonths, startOfDay, format } = require('date-fns');

/**
 * Get overall statistics for a period
 */
const getOverallStats = async (userId, period = 'week') => {
    const startDate = getStartDate(period);

    // Get all habits
    const habits = await Habit.find({ user: userId, isActive: true });
    const habitIds = habits.map(h => h._id);

    // Get logs for period
    const logs = await HabitLog.find({
        user: userId,
        habit: { $in: habitIds },
        date: { $gte: startDate }
    });

    // Calculate stats
    const totalLogs = logs.length;
    const completedLogs = logs.filter(l => l.completed).length;
    const successRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Get active streaks
    const streaks = await Streak.find({
        user: userId,
        currentStreak: { $gt: 0 }
    });

    // Get top habits by completion rate
    const habitStats = {};
    logs.forEach(log => {
        const id = log.habit.toString();
        if (!habitStats[id]) {
            habitStats[id] = { total: 0, completed: 0 };
        }
        habitStats[id].total++;
        if (log.completed) habitStats[id].completed++;
    });

    const topHabits = habits
        .map(habit => ({
            habit: { _id: habit._id, name: habit.name, icon: habit.icon },
            rate: habitStats[habit._id.toString()]
                ? Math.round((habitStats[habit._id.toString()].completed / habitStats[habit._id.toString()].total) * 100)
                : 0,
            completed: habitStats[habit._id.toString()]?.completed || 0
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);

    // Completion trend (daily)
    const timeline = await getCompletionTimeline(userId, startDate);

    return {
        totalCompletions: completedLogs,
        successRate,
        activeStreaks: streaks.length,
        totalHabits: habits.length,
        topHabits,
        timeline
    };
};

/**
 * Get daily completion timeline
 */
const getCompletionTimeline = async (userId, startDate) => {
    const logs = await HabitLog.aggregate([
        {
            $match: {
                user: userId,
                date: { $gte: startDate },
                completed: true
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                completions: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return logs.map(l => ({
        date: l._id,
        completions: l.completions
    }));
};

/**
 * Get analytics for a specific habit
 */
const getHabitAnalytics = async (userId, habitId) => {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const logs = await HabitLog.find({
        user: userId,
        habit: habitId,
        date: { $gte: thirtyDaysAgo }
    });

    const totalLogs = logs.length;
    const completedLogs = logs.filter(l => l.completed).length;
    const completionRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Best day analysis
    const dayCount = {};
    logs.filter(l => l.completed).forEach(log => {
        const day = format(log.date, 'EEEE');
        dayCount[day] = (dayCount[day] || 0) + 1;
    });

    let bestDay = null;
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCount)) {
        if (count > maxCount) {
            maxCount = count;
            bestDay = day;
        }
    }

    // Difficulty feedback
    const difficultyFeedback = {};
    logs.forEach(log => {
        if (log.difficulty) {
            difficultyFeedback[log.difficulty] = (difficultyFeedback[log.difficulty] || 0) + 1;
        }
    });

    // Get streak
    const streak = await Streak.findOne({ user: userId, habit: habitId });

    return {
        completionRate,
        totalCompletions: completedLogs,
        bestDay,
        difficultyFeedback,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        timeline: logs.map(l => ({
            date: format(l.date, 'yyyy-MM-dd'),
            completed: l.completed,
            mood: l.mood
        }))
    };
};

/**
 * Get heatmap data for a year
 */
const getHeatmapData = async (userId, habitId, year) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const logs = await HabitLog.find({
        user: userId,
        habit: habitId,
        date: { $gte: startDate, $lte: endDate }
    });

    const heatmapData = {};
    logs.forEach(log => {
        const dateKey = format(log.date, 'yyyy-MM-dd');
        heatmapData[dateKey] = log.completed ? 1 : 0;
    });

    return heatmapData;
};

/**
 * Compare multiple habits
 */
const compareHabits = async (userId, habitIds) => {
    const comparison = [];

    for (const habitId of habitIds) {
        const habit = await Habit.findOne({ _id: habitId, user: userId });
        if (!habit) continue;

        const analytics = await getHabitAnalytics(userId, habitId);

        comparison.push({
            habit: {
                _id: habit._id,
                name: habit.name,
                icon: habit.icon,
                category: habit.category
            },
            completionRate: analytics.completionRate,
            currentStreak: analytics.currentStreak,
            longestStreak: analytics.longestStreak,
            totalCompletions: analytics.totalCompletions
        });
    }

    // Determine winner
    const sorted = [...comparison].sort((a, b) => b.completionRate - a.completionRate);

    return {
        habits: comparison,
        winner: sorted[0]?.habit || null,
        insights: generateComparisonInsights(comparison)
    };
};

/**
 * Generate comparison insights
 */
const generateComparisonInsights = (comparison) => {
    const insights = [];

    if (comparison.length < 2) return insights;

    const sorted = [...comparison].sort((a, b) => b.completionRate - a.completionRate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    if (best.completionRate - worst.completionRate > 30) {
        insights.push(`${best.habit.name} outperforms ${worst.habit.name} by ${best.completionRate - worst.completionRate}%`);
    }

    return insights;
};

/**
 * Get start date based on period
 */
const getStartDate = (period) => {
    switch (period) {
        case 'week':
            return subDays(new Date(), 7);
        case 'month':
            return subMonths(new Date(), 1);
        case 'year':
            return subMonths(new Date(), 12);
        default:
            return subDays(new Date(), 7);
    }
};

module.exports = {
    getOverallStats,
    getHabitAnalytics,
    getHeatmapData,
    compareHabits
};
