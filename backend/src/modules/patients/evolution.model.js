const mongoose = require('mongoose');

const evolutionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis:{
    Cid:{type:mongoose.Schema.Types.String ,ref: 'medical_records' },
    description:{ type:mongoose.Schema.Types.String,ref: 'medical_records' }
    },
    evolutionText:{ type: String },
    conduct:{ type: String },
    patientRecommendations:{ type: String },
    canceled: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
    canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const Evolution = mongoose.models.Evolution || mongoose.model('Evolution', evolutionSchema, 'evolutions');

module.exports = Evolution;