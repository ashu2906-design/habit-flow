const express = require('express');
const router = express.Router();
const {
    getAllStreaks,
    getHabitStreak,
    getLeaderboard,
    recoverStreak
} = require('../controllers/streakController');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/', getAllStreaks);
router.get('/leaderboard', getLeaderboard);
router.get('/habit/:habitId', getHabitStreak);
router.post('/:habitId/recover', recoverStreak);

module.exports = router;
