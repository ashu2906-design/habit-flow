const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { subDays } = require('date-fns');

/**
 * Auto-adjust habit difficulty based on performance
 */
const adjustDifficulty = async (habitId) => {
    const habit = await Habit.findById(habitId);

    if (!habit || !habit.autoAdjustDifficulty) {
        return { shouldAdjust: false };
    }

    // Get last 2 weeks of logs
    const twoWeeksAgo = subDays(new Date(), 14);
    const logs = await HabitLog.find({
        habit: habitId,
        date: { $gte: twoWeeksAgo }
    });

    if (logs.length < 7) {
        return { shouldAdjust: false, reason: 'Not enough data' };
    }

    const completed = logs.filter(l => l.completed).length;
    const successRate = (completed / logs.length) * 100;

    let shouldAdjust = false;
    let newDifficulty = habit.difficulty;
    let message = '';

    // High success rate on medium/easy -> suggest harder
    if (successRate >= 90 && habit.difficulty !== 'hard') {
        shouldAdjust = true;
        newDifficulty = habit.difficulty === 'easy' ? 'medium' : 'hard';
        message = "You're crushing this! Ready to level up?";
    }
    // Low success rate on hard/medium -> suggest easier
    else if (successRate < 40 && habit.difficulty !== 'easy') {
        shouldAdjust = true;
        newDifficulty = habit.difficulty === 'hard' ? 'medium' : 'easy';
        message = "Let's make this more manageable for now.";
    }

    return {
        shouldAdjust,
        currentDifficulty: habit.difficulty,
        newDifficulty,
        successRate: Math.round(successRate),
        message
    };
};

/**
 * Get difficulty feedback trends
 */
const getDifficultyFeedback = async (habitId) => {
    const logs = await HabitLog.find({
        habit: habitId,
        difficulty: { $exists: true, $ne: null }
    })
        .sort({ date: -1 })
        .limit(30);

    if (logs.length === 0) {
        return { hasEnoughData: false };
    }

    const feedback = {
        'too-easy': 0,
        'just-right': 0,
        'challenging': 0,
        'too-hard': 0
    };

    logs.forEach(log => {
        if (log.difficulty in feedback) {
            feedback[log.difficulty]++;
        }
    });

    const total = logs.length;
    let recommendation = null;

    const tooEasyPercent = (feedback['too-easy'] / total) * 100;
    const tooHardPercent = (feedback['too-hard'] / total) * 100;

    if (tooEasyPercent > 50) {
        recommendation = 'Consider making this habit more challenging';
    } else if (tooHardPercent > 50) {
        recommendation = 'This might be too difficult, consider simplifying';
    } else if ((feedback['just-right'] + feedback['challenging']) / total > 0.7) {
        recommendation = 'Difficulty level seems perfect!';
    }

    return {
        hasEnoughData: true,
        feedback,
        total,
        trend: tooHardPercent > tooEasyPercent ? 'struggling' : 'comfortable',
        recommendation
    };
};

/**
 * Apply difficulty adjustment
 */
const applyDifficultyAdjustment = async (habitId, newDifficulty) => {
    const habit = await Habit.findByIdAndUpdate(
        habitId,
        { difficulty: newDifficulty },
        { new: true }
    );

    return habit;
};

module.exports = {
    adjustDifficulty,
    getDifficultyFeedback,
    applyDifficultyAdjustment
};
