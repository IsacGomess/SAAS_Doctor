const Appointment = require('./appointment.model.js');
const mongoose = require('mongoose');

class AppointmentService {
    buildRecurringDates(startDate, daysWindow = 30) {
        const dates = [new Date(startDate)];
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + daysWindow);

        let cursor = new Date(startDate);
        while (true) {
            cursor = new Date(cursor);
            cursor.setDate(cursor.getDate() + 7);

            if (cursor > endDate) {
                break;
            }

            dates.push(new Date(cursor));
        }

        return dates;
    }

    buildAppointmentScopeFilter(userId, clinicaId) {
        if (clinicaId) {
            return { clinicaId };
        }

        return {
            clinicaId: null,
            profissionalId: userId
        };
    }

    normalizeUniqueDates(dates) {
        const uniqueMap = new Map();
        dates.forEach((date) => {
            uniqueMap.set(new Date(date).toISOString(), new Date(date));
        });

        return Array.from(uniqueMap.values()).sort((a, b) => a.getTime() - b.getTime());
    }

    async validateScheduleConflicts({ dates, patientId, userId, clinicaId }) {
        const scopeFilter = this.buildAppointmentScopeFilter(userId, clinicaId);

        // Conflito de horário do profissional (não permite sobreposição em status ativos)
        const professionalConflicts = await Appointment.find({
            ...scopeFilter,
            appointmentDate: { $in: dates },
            status: { $ne: 'cancelado' }
        })
            .select('appointmentDate')
            .lean();

        if (professionalConflicts.length > 0) {
            const firstConflict = professionalConflicts[0].appointmentDate;
            const error = new Error(
                `Conflito de horário detectado em ${new Date(firstConflict).toLocaleString('pt-BR')}.`
            );
            error.statusCode = 409;
            throw error;
        }

        // Evita duplicar ocorrência para o mesmo paciente no mesmo slot
        const duplicatedOccurrences = await Appointment.find({
            ...scopeFilter,
            patientId,
            appointmentDate: { $in: dates }
        })
            .select('appointmentDate')
            .lean();

        if (duplicatedOccurrences.length > 0) {
            const firstDuplicate = duplicatedOccurrences[0].appointmentDate;
            const error = new Error(
                `Já existe agendamento desse paciente em ${new Date(firstDuplicate).toLocaleString('pt-BR')}.`
            );
            error.statusCode = 409;
            throw error;
        }
    }

    // Cria um agendamento garantindo o vínculo com clínica ou profissional privado
    async createAppointment(appointmentData, userId, clinicaId) {
        const initialDate = new Date(appointmentData.appointmentDate);
        if (Number.isNaN(initialDate.getTime())) {
            const error = new Error('Data de agendamento inválida.');
            error.statusCode = 400;
            throw error;
        }

        const isRecurring = Boolean(appointmentData.isRecurring);
        const recurrenceWindowDays = 30;
        const generatedDates = isRecurring
            ? this.buildRecurringDates(initialDate, recurrenceWindowDays)
            : [initialDate];

        const uniqueDates = this.normalizeUniqueDates(generatedDates);

        await this.validateScheduleConflicts({
            dates: uniqueDates,
            patientId: appointmentData.patientId,
            userId,
            clinicaId: clinicaId || null
        });

        const recurrenceSeriesId = isRecurring ? new mongoose.Types.ObjectId() : null;
        const finalData = uniqueDates.map((appointmentDate) => ({
            patientId: appointmentData.patientId,
            profissionalId: userId,
            clinicaId: clinicaId || null,
            appointmentDate,
            notes: appointmentData.notes,
            status: 'agendado',
            recurrenceSeriesId,
            recurrencePattern: isRecurring ? 'weekly' : 'none'
        }));

        const createdAppointments = await Appointment.insertMany(finalData, { ordered: true });

        return {
            appointments: createdAppointments,
            recurrence: {
                enabled: isRecurring,
                seriesId: recurrenceSeriesId,
                windowDays: recurrenceWindowDays
            }
        };
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