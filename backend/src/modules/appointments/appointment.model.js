const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    profissionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clinicaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinica', default: null },
    appointmentDate: { type: Date, required: true }, // Guarda data e hora juntas
    durationMinutes: { type: Number, default: 30 },
    status: { 
        type: String, 
        enum: ['agendado', 'confirmado', 'cancelado', 'atendido'], 
        default: 'agendado' 
    },
    notes: { type: String, default: '' }
}, { timestamps: true });

appointmentSchema.index({ clinicaId: 1, status: 1, appointmentDate: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema, 'appointments');

module.exports = Appointment;