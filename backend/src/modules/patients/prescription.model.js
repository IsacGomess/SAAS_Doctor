const mongoose = require('mongoose');
const signingRecordSchema = require('./signingRecord.schema.js');

const prescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis:{
        Cid:{type:mongoose.Schema.Types.String ,ref: 'medical_records' }, 
        description:{ type:mongoose.Schema.Types.String, ref: 'medical_records' }
    },
    medications:[{
        name:{ type: String, required: true },
        dosage:{ type: String, required: true },
        frequency:{ type: String, required: true },
        duration:{ type: String, required: true },
    }],
    observations:{ type: String },
    canceled: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
    canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    signingRecord: { type: signingRecordSchema, default: () => ({}) },
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema, 'prescriptions');

module.exports = Prescription;