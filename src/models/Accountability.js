const mongoose = require('mongoose');
const { ACCOUNTABILITY_STATUS } = require('../config/constants');

const accountabilitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ACCOUNTABILITY_STATUS,
        default: 'pending'
    },

    sharedHabits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    }],

    settings: {
        allowNotifications: { type: Boolean, default: true },
        shareAllHabits: { type: Boolean, default: false }
    },

    createdAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date }
});

// Indexes
accountabilitySchema.index({ user: 1, partner: 1 }, { unique: true });
accountabilitySchema.index({ user: 1, status: 1 });
accountabilitySchema.index({ partner: 1, status: 1 });

module.exports = mongoose.model('Accountability', accountabilitySchema);
