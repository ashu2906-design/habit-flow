const mongoose = require('mongoose');
const { MOOD_OPTIONS, DIFFICULTY_FEEDBACK } = require('../config/constants');

const habitLogSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: { type: Date },

    // Additional tracking
    notes: {
        type: String,
        maxlength: 500
    },
    mood: {
        type: String,
        enum: MOOD_OPTIONS
    },
    difficulty: {
        type: String,
        enum: DIFFICULTY_FEEDBACK
    },
    duration: { type: Number, min: 0 },

    // Context
    location: { type: String, maxlength: 100 },
    weather: { type: String, maxlength: 50 },
    energy: {
        type: Number,
        min: 1,
        max: 5
    },

    // Forgiveness tracking
    isForgiven: { type: Boolean, default: false },
    forgivenReason: { type: String, maxlength: 200 },

    createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
habitLogSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });
habitLogSchema.index({ user: 1, date: 1 });
habitLogSchema.index({ habit: 1, date: -1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);
