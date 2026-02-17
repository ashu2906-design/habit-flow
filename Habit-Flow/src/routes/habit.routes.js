const express = require('express');
const router = express.Router();
const {
    getHabits,
    getHabit,
    createHabit,
    updateHabit,
    deleteHabit,
    pauseHabit,
    resumeHabit,
    getStackSuggestions
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth.middleware');
const { habitValidation, mongoIdParam } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getHabits)
    .post(habitValidation, createHabit);

router.route('/:id')
    .get(mongoIdParam, getHabit)
    .put(mongoIdParam, updateHabit)
    .delete(mongoIdParam, deleteHabit);

router.patch('/:id/pause', mongoIdParam, pauseHabit);
router.patch('/:id/resume', mongoIdParam, resumeHabit);
router.get('/:id/stack-suggestions', mongoIdParam, getStackSuggestions);

module.exports = router;
