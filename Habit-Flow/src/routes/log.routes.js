const express = require('express');
const router = express.Router();
const {
    createLog,
    getLogs,
    getTodayLogs,
    updateLog,
    forgiveLog,
    getCalendarData
} = require('../controllers/logController');
const { protect } = require('../middleware/auth.middleware');
const { logValidation, mongoIdParam } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getLogs)
    .post(logValidation, createLog);

router.get('/today', getTodayLogs);

router.route('/:id')
    .put(mongoIdParam, updateLog);

router.post('/:id/forgive', mongoIdParam, forgiveLog);
router.get('/calendar/:habitId', getCalendarData);

module.exports = router;
