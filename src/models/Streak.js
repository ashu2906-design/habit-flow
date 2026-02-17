const mongoose = require('mongoose');
const { DEFAULT_FORGIVENESS_LIMIT, STREAK_MILESTONES } = require('../config/constants');

const streakSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    habit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true
    },

    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },

    streakStartDate: { type: Date },
    lastCompletedDate: { type: Date },

    // Forgiveness system
    forgivenessUsed: { type: Number, default: 0 },
    maxForgiveness: { type: Number, default: DEFAULT_FORGIVENESS_LIMIT },
    forgivenessResetDate: { type: Date },

    // Streak history
    streakHistory: [{
        streak: { type: Number },
        startDate: { type: Date },
        endDate: { type: Date },
        reason: {
            type: String,
            enum: ['completed', 'broken', 'paused']
        }
    }],

    // Milestones achieved
    milestones: [{
        days: { type: Number },
        achievedDate: { type: Date }
    }],

    updatedAt: { type: Date, default: Date.now }
});

// Compound index
streakSchema.index({ user: 1, habit: 1 }, { unique: true });
streakSchema.index({ user: 1, currentStreak: -1 });

// Update timestamp
streakSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Check for milestone achievement
streakSchema.methods.checkMilestone = function () {
    const achievedMilestones = this.milestones.map(m => m.days);

    for (const milestone of STREAK_MILESTONES) {
        if (this.currentStreak >= milestone && !achievedMilestones.includes(milestone)) {
            return milestone;
        }
    }
    return null;
};

module.exports = mongoose.model('Streak', streakSchema);
