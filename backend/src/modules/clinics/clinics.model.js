const mongoose = require('mongoose');

const clinicaSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    cnpj: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    donoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const Clinica = mongoose.models.Clinica || mongoose.model('Clinica', clinicaSchema, 'clinicas');
module.exports = Clinica;
