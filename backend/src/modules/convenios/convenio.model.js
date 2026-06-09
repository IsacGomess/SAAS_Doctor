const mongoose = require('mongoose');

const convenioSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true, 
        trim: true 
    },
    clinicaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Clinica', 
        required: true 
    },
    ativo: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

// Índice composto único: previne nomes duplicados por clínica
convenioSchema.index({ nome: 1, clinicaId: 1 }, { unique: true });

const Convenio = mongoose.model('Convenio', convenioSchema, 'convenios');

module.exports = Convenio;
