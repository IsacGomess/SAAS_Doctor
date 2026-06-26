const mongoose = require('mongoose');

const waitingLineSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lineNumber: { type: Number, required: true },
    clinicaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinica', default: null },
    status: {
        type: String,
        enum: ['aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado'],
        default: 'aguardando',
    },
    flowStage: {
        type: String,
        enum: ['recepcao', 'triagem', 'espera', 'consulta', 'retorno', 'internacao'],
        default: 'espera',
    },
    priority: {
        type: String,
        enum: ['normal', 'prioritario', 'emergencia'],
        default: 'normal',
    },
    clinicArea: { type: String },
    source: {
        type: String,
        enum: ['avulso', 'consulta_agendada', 'emergencia'],
        default: 'avulso',
    },
    estimatedWaitMinutes: { type: Number },
    checkInAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    attendedAt: { type: Date },
    completedAt: { type: Date },
    cancelledReason: { type: String },      
    observations: { type: String },
}, { timestamps: true });

waitingLineSchema.index({ clinicaId: 1, status: 1, checkInAt: 1 });
const WaitingLine = mongoose.models.WaitingLine || mongoose.model('WaitingLine', waitingLineSchema, 'waiting_lines');

module.exports = WaitingLine;
