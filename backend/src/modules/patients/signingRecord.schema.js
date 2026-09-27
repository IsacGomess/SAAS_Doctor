const mongoose = require('mongoose');

const signingRecordSchema = new mongoose.Schema({
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    method: {
        type: String,
        enum: ['signature_screen'],
        default: null
    }
}, {
    _id: false
});

module.exports = signingRecordSchema;
