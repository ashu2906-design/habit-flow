const Streak = require('../models/Streak');
const Habit = require('../models/Habit');
const streakService = require('../services/streakService');

/**
 * @desc    Get all streaks
 * @route   GET /api/streaks
 */
const getAllStreaks = async (req, res, next) => {
    try {
        const streaks = await Streak.find({ user: req.user._id })
            .populate('habit', 'name icon color category')
            .sort({ currentStreak: -1 });

        res.json({
            success: true,
            data: { streaks }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get streak for a habit
 * @route   GET /api/streaks/habit/:habitId
 */
const getHabitStreak = async (req, res, next) => {
    try {
        const streak = await Streak.findOne({
            user: req.user._id,
            habit: req.params.habitId
        }).populate('habit', 'name icon color category');

        if (!streak) {
            return res.status(404).json({
                success: false,
                message: 'Streak not found'
            });
        }

        res.json({
            success: true,
            data: { streak }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get leaderboard
 * @route   GET /api/streaks/leaderboard
 */
const getLeaderboard = async (req, res, next) => {
    try {
        // Get top streaks across all users (public habits only)
        const topStreaks = await Streak.aggregate([
            {
                $lookup: {
                    from: 'habits',
                    localField: 'habit',
                    foreignField: '_id',
                    as: 'habitInfo'
                }
            },
            { $unwind: '$habitInfo' },
            { $match: { 'habitInfo.isPublic': true } },
            { $sort: { currentStreak: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    currentStreak: 1,
                    longestStreak: 1,
                    'habitInfo.name': 1,
                    'habitInfo.icon': 1,
                    'userInfo.username': 1,
                    'userInfo.profile.avatar': 1
                }
            }
        ]);

        // Get user's rank
        const userStreaks = await Streak.find({ user: req.user._id })
            .sort({ currentStreak: -1 })
            .limit(1);

        res.json({
            success: true,
            data: {
                topStreaks,
                userBestStreak: userStreaks[0] || null
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Recover a streak
 * @route   POST /api/streaks/:habitId/recover
 */
const recoverStreak = async (req, res, next) => {
    try {
        const { date, reason } = req.body;

        const result = await streakService.recoverStreak(
            req.user._id,
            req.params.habitId,
            new Date(date),
            reason
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            data: { streak: result.streak }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllStreaks,
    getHabitStreak,
    getLeaderboard,
    recoverStreak
};
