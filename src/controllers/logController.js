const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const streakService = require('../services/streakService');
const { startOfDay, endOfDay, parseISO } = require('date-fns');

/**
 * @desc    Create habit log
 * @route   POST /api/logs
 */
const createLog = async (req, res, next) => {
    try {
        const { habitId, date, completed, notes, mood, difficulty, duration } = req.body;

        // Verify habit belongs to user
        const habit = await Habit.findOne({
            _id: habitId,
            user: req.user._id
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: 'Habit not found'
            });
        }

        const logDate = startOfDay(parseISO(date));

        // Check for existing log
        let log = await HabitLog.findOne({
            user: req.user._id,
            habit: habitId,
            date: logDate
        });

        if (log) {
            // Update existing log
            log.completed = completed;
            log.completedAt = completed ? new Date() : null;
            if (notes) log.notes = notes;
            if (mood) log.mood = mood;
            if (difficulty) log.difficulty = difficulty;
            if (duration) log.duration = duration;
            await log.save();
        } else {
            // Create new log
            log = await HabitLog.create({
                user: req.user._id,
                habit: habitId,
                date: logDate,
                completed,
                completedAt: completed ? new Date() : null,
                notes,
                mood,
                difficulty,
                duration
            });
        }

        // Update streak
        const streakResult = await streakService.updateStreak(
            req.user._id,
            habitId,
            logDate,
            completed
        );

        // Update habit stats
        if (completed) {
            await Habit.findByIdAndUpdate(habitId, {
                $inc: { 'stats.totalCompletions': 1 },
                'stats.lastCompleted': new Date(),
                'stats.currentStreak': streakResult.currentStreak,
                'stats.longestStreak': Math.max(
                    habit.stats.longestStreak,
                    streakResult.longestStreak
                )
            });
        }

        res.status(201).json({
            success: true,
            data: {
                log,
                streak: streakResult
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get logs
 * @route   GET /api/logs
 */
const getLogs = async (req, res, next) => {
    try {
        const { habitId, startDate, endDate } = req.query;

        const query = { user: req.user._id };

        if (habitId) query.habit = habitId;
        if (startDate) query.date = { $gte: parseISO(startDate) };
        if (endDate) {
            query.date = query.date || {};
            query.date.$lte = endOfDay(parseISO(endDate));
        }

        const logs = await HabitLog.find(query)
            .populate('habit', 'name icon color')
            .sort({ date: -1 });

        // Calculate stats
        const total = logs.length;
        const completed = logs.filter(l => l.completed).length;

        res.json({
            success: true,
            data: {
                logs,
                stats: {
                    total,
                    completed,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get today's logs
 * @route   GET /api/logs/today
 */
const getTodayLogs = async (req, res, next) => {
    try {
        const today = startOfDay(new Date());

        // Get all active habits
        const habits = await Habit.find({
            user: req.user._id,
            isActive: true,
            isPaused: false
        }).select('name icon color category frequency');

        // Get today's logs
        const logs = await HabitLog.find({
            user: req.user._id,
            date: today
        });

        // Map habits with their completion status
        const todayHabits = habits.map(habit => {
            const log = logs.find(l => l.habit.toString() === habit._id.toString());
            return {
                habit,
                log: log || null,
                completed: log ? log.completed : false
            };
        });

        const completed = todayHabits.filter(h => h.completed).length;

        res.json({
            success: true,
            data: {
                habits: todayHabits,
                stats: {
                    total: todayHabits.length,
                    completed,
                    completionRate: todayHabits.length > 0
                        ? Math.round((completed / todayHabits.length) * 100)
                        : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update log
 * @route   PUT /api/logs/:id
 */
const updateLog = async (req, res, next) => {
    try {
        const { completed, notes, mood, difficulty, duration } = req.body;

        let log = await HabitLog.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        if (typeof completed === 'boolean') {
            log.completed = completed;
            log.completedAt = completed ? new Date() : null;
        }
        if (notes !== undefined) log.notes = notes;
        if (mood) log.mood = mood;
        if (difficulty) log.difficulty = difficulty;
        if (duration) log.duration = duration;

        await log.save();

        res.json({
            success: true,
            data: { log }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Forgive missed day
 * @route   POST /api/logs/:id/forgive
 */
const forgiveLog = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const log = await HabitLog.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        // Apply forgiveness
        const result = await streakService.applyForgiveness(
            req.user._id,
            log.habit,
            log._id,
            reason
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        log.isForgiven = true;
        log.forgivenReason = reason;
        await log.save();

        res.json({
            success: true,
            data: {
                log,
                streak: result.streak
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get calendar heatmap data
 * @route   GET /api/logs/calendar/:habitId
 */
const getCalendarData = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const { habitId } = req.params;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const logs = await HabitLog.find({
            user: req.user._id,
            habit: habitId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Format as calendar data
        const calendarData = {};
        logs.forEach(log => {
            const dateKey = log.date.toISOString().split('T')[0];
            calendarData[dateKey] = {
                completed: log.completed,
                mood: log.mood,
                isForgiven: log.isForgiven
            };
        });

        res.json({
            success: true,
            data: { calendarData }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLog,
    getLogs,
    getTodayLogs,
    updateLog,
    forgiveLog,
    getCalendarData
};
