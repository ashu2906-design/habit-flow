const Accountability = require('../models/Accountability');
const User = require('../models/User');
const Habit = require('../models/Habit');

/**
 * @desc    Send accountability request
 * @route   POST /api/accountability/request
 */
const sendRequest = async (req, res, next) => {
    try {
        const { partnerEmail, partnerUsername } = req.body;

        // Find partner
        const partner = await User.findOne({
            $or: [
                { email: partnerEmail },
                { username: partnerUsername }
            ]
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (partner._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send request to yourself'
            });
        }

        // Check if request already exists
        const existing = await Accountability.findOne({
            $or: [
                { user: req.user._id, partner: partner._id },
                { user: partner._id, partner: req.user._id }
            ]
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Accountability relationship already exists'
            });
        }

        const request = await Accountability.create({
            user: req.user._id,
            partner: partner._id
        });

        res.status(201).json({
            success: true,
            data: { request }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get accountability requests
 * @route   GET /api/accountability/requests
 */
const getRequests = async (req, res, next) => {
    try {
        // Pending requests to me
        const pending = await Accountability.find({
            partner: req.user._id,
            status: 'pending'
        }).populate('user', 'username profile.name profile.avatar');

        // Active partnerships
        const active = await Accountability.find({
            $or: [
                { user: req.user._id, status: 'accepted' },
                { partner: req.user._id, status: 'accepted' }
            ]
        })
            .populate('user', 'username profile.name profile.avatar')
            .populate('partner', 'username profile.name profile.avatar');

        res.json({
            success: true,
            data: { pending, active }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Accept request
 * @route   POST /api/accountability/:id/accept
 */
const acceptRequest = async (req, res, next) => {
    try {
        const request = await Accountability.findOne({
            _id: req.params.id,
            partner: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        request.status = 'accepted';
        request.acceptedAt = new Date();
        await request.save();

        // Add each other as accountability partners
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { accountabilityPartners: request.user }
        });
        await User.findByIdAndUpdate(request.user, {
            $addToSet: { accountabilityPartners: req.user._id }
        });

        res.json({
            success: true,
            data: { request }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reject request
 * @route   POST /api/accountability/:id/reject
 */
const rejectRequest = async (req, res, next) => {
    try {
        const request = await Accountability.findOneAndUpdate(
            {
                _id: req.params.id,
                partner: req.user._id,
                status: 'pending'
            },
            { status: 'rejected' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove partner
 * @route   DELETE /api/accountability/:id
 */
const removePartner = async (req, res, next) => {
    try {
        const partnership = await Accountability.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { user: req.user._id },
                { partner: req.user._id }
            ]
        });

        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: 'Partnership not found'
            });
        }

        // Remove from accountability partners
        await User.findByIdAndUpdate(partnership.user, {
            $pull: { accountabilityPartners: partnership.partner }
        });
        await User.findByIdAndUpdate(partnership.partner, {
            $pull: { accountabilityPartners: partnership.user }
        });

        res.json({
            success: true,
            message: 'Partnership removed'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get partners with their stats
 * @route   GET /api/accountability/partners
 */
const getPartners = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('accountabilityPartners', 'username profile stats');

        res.json({
            success: true,
            data: { partners: user.accountabilityPartners }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Share habit with partner
 * @route   POST /api/accountability/share-habit
 */
const shareHabit = async (req, res, next) => {
    try {
        const { habitId, partnerId } = req.body;

        // Verify habit ownership
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

        // Verify partnership
        const partnership = await Accountability.findOne({
            $or: [
                { user: req.user._id, partner: partnerId, status: 'accepted' },
                { user: partnerId, partner: req.user._id, status: 'accepted' }
            ]
        });

        if (!partnership) {
            return res.status(400).json({
                success: false,
                message: 'Not an accountability partner'
            });
        }

        // Share habit
        await Habit.findByIdAndUpdate(habitId, {
            $addToSet: { sharedWith: partnerId }
        });

        await Accountability.findByIdAndUpdate(partnership._id, {
            $addToSet: { sharedHabits: habitId }
        });

        res.json({
            success: true,
            message: 'Habit shared successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    removePartner,
    getPartners,
    shareHabit
};
