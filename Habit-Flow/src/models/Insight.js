const mongoose = require('mongoose');
const { INSIGHT_TYPES, PRIORITY_LEVELS } = require('../config/constants');

const insightSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    habit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    },

    type: {
        type: String,
        enum: INSIGHT_TYPES,
        required: true
    },

    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Pattern data
    pattern: {
        bestDay: { type: String },
        bestTime: { type: String },
        successRate: { type: Number },
        completionTrend: {
            type: String,
            enum: ['improving', 'stable', 'declining']
        }
    },

    // Suggestions
    suggestion: {
        action: { type: String, maxlength: 300 },
        reason: { type: String, maxlength: 300 },
        expectedImprovement: { type: String, maxlength: 200 }
    },

    // Priority
    priority: {
        type: String,
        enum: PRIORITY_LEVELS,
        default: 'medium'
    },

    isRead: { type: Boolean, default: false },

    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

// Indexes
insightSchema.index({ user: 1, isRead: 1 });
insightSchema.index({ user: 1, generatedAt: -1 });
insightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Insight', insightSchema);
