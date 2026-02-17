const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { WEEK_START_OPTIONS } = require('../config/constants');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    profile: {
        name: { type: String, default: '' },
        avatar: { type: String, default: '' },
        timezone: { type: String, default: 'UTC' },
        preferences: {
            reminderTime: { type: String, default: '09:00' },
            weekStartsOn: {
                type: String,
                enum: WEEK_START_OPTIONS,
                default: 'Monday'
            },
            forgivenessMode: { type: Boolean, default: true }
        }
    },
    stats: {
        totalHabits: { type: Number, default: 0 },
        activeHabits: { type: Number, default: 0 },
        totalCompletions: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        currentActiveStreaks: { type: Number, default: 0 }
    },
    accountabilityPartners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Update timestamp
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
