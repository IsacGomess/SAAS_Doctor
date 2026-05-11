const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    cpf:{ type: String, required: true, unique: true },
    phone:{ type: String },
    isPresent:{ type: Boolean, default: true },
    observations:{ type: String },
}, { timestamps: true });

const Patient = mongoose.model('Patient',patientSchema,'patients');

module.exports = Patient;



