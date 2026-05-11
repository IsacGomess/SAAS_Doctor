const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({ 
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosis:{ 
        Cid:{type: String},
        description:{ type: String }},
    quickHistory:[{ 
        comorbidities:String,
        diesease:String,
        observation:String
    }],
},{timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medical_records');

module.exports = MedicalRecord;
