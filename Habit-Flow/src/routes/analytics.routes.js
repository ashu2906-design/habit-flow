const express = require('express');
const router = express.Router();
const {
    getOverview,
    getHabitAnalytics,
    getPatterns,
    getInsights,
    markInsightRead,
    getHeatmap,
    compareHabits
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/overview', getOverview);
router.get('/patterns', getPatterns);
router.get('/insights', getInsights);
router.patch('/insights/:id/read', markInsightRead);
router.get('/habit/:habitId', getHabitAnalytics);
router.get('/heatmap/:habitId', getHeatmap);
router.get('/compare', compareHabits);

module.exports = router;
