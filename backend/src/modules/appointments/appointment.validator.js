// src/modules/appointments/appointment.validation.js
const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Schema para criar agendamento
const createAppointmentSchema = z.object({
    patientId: z.string().regex(objectIdRegex, "ID do paciente inválido."),
    appointmentDate: z.string({
        required_error: "A data e hora do agendamento são obrigatórias."
    }).min(1, "A data não pode estar vazia."),
    notes: z.string().max(300, "Máximo de 300 caracteres.").optional().default('')
});

// Schema para buscar por data
const listAppointmentSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD.")
});

// Schema para atualizar status
const updateStatusSchema = z.object({
    id: z.string().regex(objectIdRegex, "ID do agendamento inválido."),
    status: z.enum(['agendado', 'confirmado', 'cancelado', 'atendido'], {
        errorMap: () => ({ message: "Status inválido." })
    })
});

module.exports = { createAppointmentSchema, listAppointmentSchema, updateStatusSchema };