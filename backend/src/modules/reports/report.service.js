const mongoose = require('mongoose');
const Appointment = require('../appointments/appointment.model.js'); // Ajuste o caminho conforme seu projeto
const Patient = require('../patients/patient.model.js');
const WaitingLine = require('../waiting-line/waiting-line.model.js'); // Ajuste o caminho se houver módulo específico
const Convenio = require('../convenios/convenio.model.js');

class ReportsService {
    // 📊 Gráfico A: Volume Mensal de Agendamentos (Por Status)
        async getAppointmentsMonthly(clinicaId) {
        try {
            const currentYear = new Date().getFullYear();

            return await WaitingLine.aggregate([
                { 
                    $match: { 
                        clinicaId: new mongoose.Types.ObjectId(clinicaId),
                        checkInAt: { 
                            $gte: new Date(`${currentYear}-01-01`), 
                            $lte: new Date(`${currentYear}-12-31T23:59:59`) 
                        }
                    } 
                },
                {
                    $project: {
                        // Extrai o mês do check-in na fila
                        mes: { $dateToString: { format: "%m", date: "$checkInAt" } },
                        statusFinal: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$status", "finalizado"] }, then: "atendido" },
                                    { case: { $eq: ["$status", "cancelado"] }, then: "cancelado" }
                                ],
                                // Qualquer outro status (aguardando, chamado, em_atendimento) conta como agendado/pendente
                                default: "agendado"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            mes: "$mes",
                            status: "$statusFinal"
                        },
                        total: { $sum: 1 }
                    }
                },
                { $sort: { "_id.mes": 1 } }
            ]);
        } catch (error) {
            console.error("Erro no aggregate de Agendamentos via Fila:", error);
            throw error;
        }
    }

    // 📊 Gráfico B: Crescimento Mensal de Novos Pacientes
    async getPatientsGrowth(clinicaId) {
        const currentYear = new Date().getFullYear();
        return await Patient.aggregate([
            { 
                $match: { 
                    clinicaId: new mongoose.Types.ObjectId(clinicaId),
                    createdAt: { $gte: new Date(`${currentYear}-01-01`) }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    novosPacientes: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    }

    // 📊 Gráfico C: Tempo Médio Mensal de Espera na Fila
    async getWaitTimeMonthly(clinicaId) {
        return await WaitingLine.aggregate([
            { 
                $match: { 
                    clinicaId: new mongoose.Types.ObjectId(clinicaId),
                    status: 'finalizado',
                    checkInAt: { $exists: true },
                    attendedAt: { $exists: true }
                } 
            },
            {
                $project: {
                    mes: { $dateToString: { format: "%Y-%m", date: "$checkInAt" } },
                    tempoEsperaMinutos: {
                        $divide: [ { $subtract: ["$attendedAt", "$checkInAt"] }, 60000 ]
                    }
                }
            },
            {
                $group: {
                    _id: "$mes",
                    tempoMedioEspera: { $avg: "$tempoEsperaMinutos" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    }

    // 📊 Atendimentos mensais por plano de saúde
    async getPlansMonthly(clinicaId) {
        const currentYear = new Date().getFullYear();
        const clinicObjectId = new mongoose.Types.ObjectId(clinicaId);

        const results = await WaitingLine.aggregate([
            {
                $match: {
                    clinicaId: clinicObjectId,
                    status: 'finalizado',
                    checkInAt: {
                        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                    }
                }
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'patientId',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'convenios',
                    localField: 'patient.convenioId',
                    foreignField: '_id',
                    as: 'convenio'
                }
            },
            { $unwind: { path: '$convenio', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    mes: { $dateToString: { format: '%Y-%m', date: '$checkInAt' } },
                    plano: { $ifNull: ['$convenio.nome', 'Particular'] }
                }
            },
            {
                $group: {
                    _id: { mes: '$mes', plano: '$plano' },
                    total: { $sum: 1 }
                }
            },
            { $sort: { '_id.mes': 1, total: -1, '_id.plano': 1 } }
        ]);

        return results.map((item) => ({
            mes: item._id.mes,
            plano: item._id.plano,
            total: item.total
        }));
    }

    async getDashboardSummary(clinicaId) {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const startOfWeek = new Date(today);
            const day = today.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            startOfWeek.setDate(today.getDate() + diff);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const clinicObjectId = new mongoose.Types.ObjectId(clinicaId);
            const next7Start = new Date(today);
            next7Start.setDate(today.getDate() + 1);
            next7Start.setHours(0, 0, 0, 0);

            const next7End = new Date(today);
            next7End.setDate(today.getDate() + 7);
            next7End.setHours(23, 59, 59, 999);

            const last7Start = new Date(today);
            last7Start.setDate(today.getDate() - 6);
            last7Start.setHours(0, 0, 0, 0);

            const last7End = new Date(today);
            last7End.setHours(23, 59, 59, 999);

            const [todayAppointments, weekMetrics, newPatientsThisWeek, next7DaysAppointments, last7DaysAppointments, agendaToday, weeklyAppointmentsByDay] = await Promise.all([
                Appointment.aggregate([
                    {
                        $match: {
                            clinicaId: clinicObjectId,
                            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 }
                        }
                    }
                ]),
                WaitingLine.aggregate([
                    {
                        $match: {
                            clinicaId: clinicObjectId,
                            checkInAt: { $gte: startOfWeek, $lte: endOfWeek }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            atendidos: {
                                $sum: { $cond: [{ $eq: ["$status", "finalizado"] }, 1, 0] }
                            },
                            cancelados: {
                                $sum: { $cond: [{ $eq: ["$status", "cancelado"] }, 1, 0] }
                            }
                        }
                    }
                ]),
                Patient.countDocuments({
                    clinicaId: clinicObjectId,
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                }),
                Appointment.aggregate([
                    {
                        $match: {
                            clinicaId: clinicObjectId,
                            appointmentDate: { $gte: next7Start, $lte: next7End }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            confirmed: { $sum: { $cond: [{ $ne: ["$status", "cancelado"] }, 1, 0] } }
                        }
                    }
                ]),
                Appointment.aggregate([
                    {
                        $match: {
                            clinicaId: clinicObjectId,
                            appointmentDate: { $gte: last7Start, $lte: last7End }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            confirmed: { $sum: { $cond: [{ $ne: ["$status", "cancelado"] }, 1, 0] } }
                        }
                    }
                ]),
                Appointment.find({
                    clinicaId: clinicObjectId,
                    appointmentDate: { $gte: startOfDay, $lte: endOfDay }
                })
                .populate('patientId', 'name')
                .sort({ appointmentDate: 1 })
                .lean(),
                Appointment.aggregate([
                    {
                        $match: {
                            clinicaId: clinicObjectId,
                            appointmentDate: { $gte: startOfWeek, $lte: endOfWeek },
                            status: { $ne: 'cancelado' }
                        }
                    },
                    {
                        $group: {
                            // MongoDB: domingo = 1, segunda = 2, ..., sábado = 7.
                            _id: { $dayOfWeek: '$appointmentDate' },
                            total: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const metricsToday = todayAppointments[0] || { total: 0 };
            const metricsWeek = weekMetrics[0] || { atendidos: 0, cancelados: 0 };

            // Calcula taxa de ocupação com base na proporção de agendados válidos
            const occupiedNext7Days = next7DaysAppointments[0]?._id ? next7DaysAppointments[0].confirmed : 0;
            const totalNext7Days = next7DaysAppointments[0]?._id ? next7DaysAppointments[0].total : 0;
            const occupiedLast7Days = last7DaysAppointments[0]?._id ? last7DaysAppointments[0].confirmed : 0;
            const totalLast7Days = last7DaysAppointments[0]?._id ? last7DaysAppointments[0].total : 0;

            const occupancyNext7Days = totalNext7Days > 0 ? Math.round((occupiedNext7Days / totalNext7Days) * 100) : 0;
            const occupancyLast7Days = totalLast7Days > 0 ? Math.round((occupiedLast7Days / totalLast7Days) * 100) : 0;

            return {
                consultasHoje: metricsToday.total,
                novosPacientesSemana: newPatientsThisWeek,
                atendidosSemana: metricsWeek.atendidos,
                cancelamentosSemana: metricsWeek.cancelados,
                occupancyNext7Days,
                occupancyLast7Days,
                weeklyAppointmentsByDay: weeklyAppointmentsByDay.map(item => ({
                    dayOfWeek: item._id,
                    total: item.total
                })),
                agendaHoje: agendaToday.map(item => ({
                    _id: item._id,
                    patientName: item.patientId?.name || 'Paciente sem nome',
                    appointmentDate: item.appointmentDate,
                    status: item.status,
                    notes: item.notes || ''
                }))
            };
        } catch (error) {
            console.error('Erro ao gerar resumo do dashboard:', error);
            throw error;
        }
    }

    async getPlansWeekly(clinicaId, limit = 5) {
        try {
            const today = new Date();
            const startOfWeek = new Date(today);
            const day = today.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            startOfWeek.setDate(today.getDate() + diff);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const clinicObjectId = new mongoose.Types.ObjectId(clinicaId);

            const pipeline = [
                { $match: { clinicaId: clinicObjectId, checkInAt: { $gte: startOfWeek, $lte: endOfWeek } } },
                {
                    $lookup: {
                        from: 'patients',
                        localField: 'patientId',
                        foreignField: '_id',
                        as: 'patient'
                    }
                },
                { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'convenios',
                        localField: 'patient.convenioId',
                        foreignField: '_id',
                        as: 'convenio'
                    }
                },
                { $unwind: { path: '$convenio', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        convenioNome: { $ifNull: ['$convenio.nome', 'Particular'] }
                    }
                },
                {
                    $group: {
                        _id: '$convenioNome',
                        total: { $sum: 1 }
                    }
                },
                { $sort: { total: -1 } },
                { $limit: limit }
            ];

            const results = await WaitingLine.aggregate(pipeline);
            return results.map(r => ({ nome: r._id, total: r.total }));
        } catch (error) {
            console.error('Erro ao gerar ranking de planos semanais:', error);
            throw error;
        }
    }
}

// Exporta a instância pronta seguindo o seu padrão
module.exports = new ReportsService();