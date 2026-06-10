const Appointment = require('./appointment.model.js');

class AppointmentService {
    // Cria um agendamento garantindo o vínculo com clínica ou profissional privado
    async createAppointment(appointmentData, userId, clinicaId) {
        // Garantimos que a data inserida mantenha o tempo absoluto enviado pelo front
        const finalData = {
            patientId: appointmentData.patientId,
            profissionalId: userId,
            clinicaId: clinicaId || null,
            appointmentDate: new Date(appointmentData.appointmentDate), // Mantém o Date padrão
            notes: appointmentData.notes,
            status: 'agendado'
        };
        return await Appointment.create(finalData);
    }

    // Busca agendamentos do dia ou período filtrando por clínica ou profissional
    async getAppointments(userId, clinicaId, dateStr) {
        // ✅ SOLUÇÃO DO BUG: Quebramos a string "YYYY-MM-DD" para evitar desvios de fuso horário
        const [year, month, day] = dateStr.split('-').map(Number);

        // Criamos o início do dia usando os componentes numéricos exatos (Mês no JS começa em 0)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        
        // Criamos o fim do dia na mesma lógica absoluta
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        let filter = {
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        };

        if (clinicaId) {
            filter.clinicaId = clinicaId;
        } else {
            filter.profissionalId = userId;
        }

        return await Appointment.find(filter)
            .populate('patientId', 'name cpf phone')
            .sort({ appointmentDate: 1 });
    }

    // Atualiza o status
    async updateStatus(appointmentId, status) {
        return await Appointment.findByIdAndUpdate(
            appointmentId, 
            { status }, 
            { new: true }
        );
    }
}

module.exports = new AppointmentService();