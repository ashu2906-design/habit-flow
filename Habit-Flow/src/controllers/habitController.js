const Habit = require('../models/Habit');
const Streak = require('../models/Streak');
const User = require('../models/User');

/**
 * @desc    Get all habits for current user
 * @route   GET /api/habits
 */
const getHabits = async (req, res, next) => {
    try {
        const { category, isActive, isPaused } = req.query;

        const query = { user: req.user._id };

        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (isPaused !== undefined) query.isPaused = isPaused === 'true';

        const habits = await Habit.find(query)
            .sort({ createdAt: -1 })
            .populate('stackedWith', 'name icon');

        res.json({
            success: true,
            count: habits.length,
            data: { habits }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single habit
 * @route   GET /api/habits/:id
 */
const getHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('stackedWith', 'name icon');

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        // Get streak info
        const streak = await Streak.findOne({
            habit: habit._id,
            user: req.user._id
        });

        res.json({
            success: true,
            data: {
                habit,
                streak: streak || { currentStreak: 0, longestStreak: 0 }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new habit
 * @route   POST /api/habits
 */
const createHabit = async (req, res, next) => {
    try {
        const habitData = {
            ...req.body,
            user: req.user._id
        };

        const habit = await Habit.create(habitData);

        // Create streak record
        await Streak.create({
            user: req.user._id,
            habit: habit._id,
            forgivenessResetDate: new Date()
        });

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.totalHabits': 1, 'stats.activeHabits': 1 }
        });

        res.status(201).json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update habit
 * @route   PUT /api/habits/:id
 */
const updateHabit = async (req, res, next) => {
    try {
        let habit = await Habit.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        // Don't allow updating certain fields
        const { user, stats, createdAt, ...updateData } = req.body;

        habit = await Habit.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete habit
 * @route   DELETE /api/habits/:id
 */
const deleteHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        await habit.deleteOne();

        // Delete associated streak
        await Streak.deleteOne({ habit: req.params.id });

        // Update user stats
        const decrement = {
            'stats.totalHabits': -1
        };
        if (habit.isActive) decrement['stats.activeHabits'] = -1;

        await User.findByIdAndUpdate(req.user._id, { $inc: decrement });

        res.json({
            success: true,
            message: 'Habit deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Pause habit
 * @route   PATCH /api/habits/:id/pause
 */
const pauseHabit = async (req, res, next) => {
    try {
        const { pausedUntil } = req.body;

        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                isPaused: true,
                pausedUntil: pausedUntil ? new Date(pausedUntil) : null
            },
            { new: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Resume habit
 * @route   PATCH /api/habits/:id/resume
 */
const resumeHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isPaused: false, pausedUntil: null },
            { new: true }
        );

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        res.json({
            success: true,
            data: { habit }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get habit stack suggestions
 * @route   GET /api/habits/:id/stack-suggestions
 */
const getStackSuggestions = async (req, res, next) => {
    try {
        const currentHabit = await Habit.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!currentHabit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        // Find habits that could be stacked
        // - Same category or complementary categories
        // - Similar time of day
        // - Not already stacked with this habit
        const suggestions = await Habit.find({
            user: req.user._id,
            _id: { $ne: req.params.id },
            isActive: true,
            isPaused: false,
            stackedWith: { $ne: req.params.id }
        })
            .limit(5)
            .select('name icon category preferredTime stats.successRate');

        res.json({
            success: true,
            data: { suggestions }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHabits,
    getHabit,
    createHabit,
    updateHabit,
    deleteHabit,
    pauseHabit,
    resumeHabit,
    getStackSuggestions
};
