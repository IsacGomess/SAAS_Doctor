const mongoose = require('mongoose');

const clinicaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cnpj: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    donoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Clinica = mongoose.model('Clinica', clinicaSchema, 'clinicas');
module.exports = Clinica;
