const express = require('express');
const router = express.Router();
const {
    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    removePartner,
    getPartners,
    shareHabit
} = require('../controllers/socialController');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.post('/request', sendRequest);
router.get('/requests', getRequests);
router.post('/:id/accept', acceptRequest);
router.post('/:id/reject', rejectRequest);
router.delete('/:id', removePartner);
router.get('/partners', getPartners);
router.post('/share-habit', shareHabit);

module.exports = router;
