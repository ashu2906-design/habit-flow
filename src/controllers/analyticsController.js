const analyticsService = require('../services/analyticsService');
const insightService = require('../services/insightService');
const Insight = require('../models/Insight');

/**
 * @desc    Get overview stats
 * @route   GET /api/analytics/overview
 */
const getOverview = async (req, res, next) => {
    try {
        const { period = 'week' } = req.query;

        const stats = await analyticsService.getOverallStats(req.user._id, period);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get habit analytics
 * @route   GET /api/analytics/habit/:habitId
 */
const getHabitAnalytics = async (req, res, next) => {
    try {
        const analytics = await analyticsService.getHabitAnalytics(
            req.user._id,
            req.params.habitId
        );

        res.json({
            success: true,
            data: { analytics }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get patterns
 * @route   GET /api/analytics/patterns
 */
const getPatterns = async (req, res, next) => {
    try {
        const patterns = await insightService.detectPatterns(req.user._id);

        res.json({
            success: true,
            data: { patterns }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get insights
 * @route   GET /api/analytics/insights
 */
const getInsights = async (req, res, next) => {
    try {
        const insights = await Insight.find({
            user: req.user._id,
            isRead: false
        })
            .populate('habit', 'name icon')
            .sort({ generatedAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: { insights }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark insight as read
 * @route   PATCH /api/analytics/insights/:id/read
 */
const markInsightRead = async (req, res, next) => {
    try {
        const insight = await Insight.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!insight) {
            return res.status(404).json({
                success: false,
                message: 'Insight not found'
            });
        }

        res.json({
            success: true,
            data: { insight }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get heatmap data
 * @route   GET /api/analytics/heatmap/:habitId
 */
const getHeatmap = async (req, res, next) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        const heatmapData = await analyticsService.getHeatmapData(
            req.user._id,
            req.params.habitId,
            parseInt(year)
        );

        res.json({
            success: true,
            data: { heatmapData }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Compare habits
 * @route   GET /api/analytics/compare
 */
const compareHabits = async (req, res, next) => {
    try {
        const { habitIds } = req.query;

        if (!habitIds) {
            return res.status(400).json({
                success: false,
                message: 'habitIds query parameter is required'
            });
        }

        const ids = habitIds.split(',');
        const comparison = await analyticsService.compareHabits(req.user._id, ids);

        res.json({
            success: true,
            data: { comparison }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getHabitAnalytics,
    getPatterns,
    getInsights,
    markInsightRead,
    getHeatmap,
    compareHabits
};
