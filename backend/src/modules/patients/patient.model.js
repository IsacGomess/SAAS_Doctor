const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    cpf:{ type: String, required: true, unique: true },
    phone:{ type: String },
    // clinicaId: associated clinic for multi-tenant isolation
    clinicaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinica', default: null },
    // profissionalId: when patient is personal to a professional (no clinic)
    profissionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // convenioId: health insurance plan, null means "Particular" (no insurance)
    convenioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Convenio', default: null },
    idade: { type: Number },
    isPresent:{ type: Boolean, default: false },
    observations:{ type: String },
}, { timestamps: true });

const Patient = mongoose.model('Patient',patientSchema,'patients');

module.exports = Patient;



