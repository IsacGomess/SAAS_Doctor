const mongoose = require('mongoose');

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
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema, 'prescriptions');

module.exports = Prescription;