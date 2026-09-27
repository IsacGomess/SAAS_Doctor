const mongoose = require('mongoose');
const signingRecordSchema = require('./signingRecord.schema.js');

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

// campos de cancelamento (visual) - permitem marcar sem excluir do prontuário
medicalRecordSchema.add({
    canceled: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
    canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    signingRecord: { type: signingRecordSchema, default: () => ({}) }
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medical_records');

module.exports = MedicalRecord;
