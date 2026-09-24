const AppointmentService = require('./appoint.service.js');
// Importa os schemas do Passo 1
const { createAppointmentSchema, listAppointmentSchema, updateStatusSchema } = require('./appointment.validator.js');

exports.create = async (req, res) => {
    // 🛡️ VALIDAÇÃO DO ZOD DIRECTA NO CONTROLLER
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const userId = req.userId;
        const clinicaId = req.clinicaId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Usuário não autenticado." });
        }

        const result = await AppointmentService.createAppointment(req.body, userId, clinicaId);
        const appointments = result?.appointments || [];
        const recurrence = result?.recurrence || { enabled: false };
        
        return res.status(201).json({
            success: true,
            message: recurrence.enabled
                ? `Agendamentos recorrentes criados com sucesso (${appointments.length} ocorrências).`
                : "Agendamento realizado com sucesso!",
            appointment: appointments[0] || null,
            appointments,
            createdCount: appointments.length,
            recurrence
        });
    } catch (error) {
        const statusCode = error?.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message });
    }
};

exports.listByDate = async (req, res) => {
    // 🛡️ VALIDAÇÃO DO ZOD DIRECTA NA QUERY
    const validation = listAppointmentSchema.safeParse(req.query);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const userId = req.userId;
        const clinicaId = req.clinicaId;
        const { date } = req.query;

        const appointments = await AppointmentService.getAppointments(userId, clinicaId, date);
        
        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    // 🛡️ VALIDAÇÃO JUNTANDO PARAMS E BODY
    const validation = updateStatusSchema.safeParse({ id: req.params.id, status: req.body.status });
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updated = await AppointmentService.updateStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: "Agendamento não encontrado." });
        }

        return res.status(200).json({
            success: true,
            message: `Status atualizado para ${status}!`,
            appointment: updated
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};