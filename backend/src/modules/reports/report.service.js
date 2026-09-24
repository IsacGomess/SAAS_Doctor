const mongoose = require('mongoose');
const Appointment = require('../appointments/appointment.model.js'); // Ajuste o caminho conforme seu projeto
const Patient = require('../patients/patient.model.js');
const WaitingLine = require('../waiting-line/waiting-line.model.js'); // Ajuste o caminho se houver módulo específico
const Convenio = require('../convenios/convenio.model.js');
const User = require('../users/user.model.js');

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

    async getDashboardSummary(clinicaId, userId, subscriptionPlan = null) {
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

            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

            const startOfFourMonthsWindow = new Date(today.getFullYear(), today.getMonth() - 3, 1, 0, 0, 0, 0);
            const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

            const clinicObjectId = clinicaId ? new mongoose.Types.ObjectId(clinicaId) : null;
            const professionalObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;
            const scopeFilter = clinicObjectId
                ? { clinicaId: clinicObjectId }
                : { clinicaId: null, profissionalId: professionalObjectId };
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

            const [todayAppointments, weekMetrics, newPatientsThisWeek, next7DaysAppointments, last7DaysAppointments, agendaToday, weeklyAppointmentsByDay, weeklyStatusByDay] = await Promise.all([
                Appointment.aggregate([
                    {
                        $match: {
                            ...scopeFilter,
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
                            ...(clinicObjectId ? { clinicaId: clinicObjectId } : { assignedTo: professionalObjectId }),
                            checkInAt: { $gte: startOfWeek, $lte: endOfWeek }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            atendidos: { $sum: { $cond: [{ $eq: ["$status", "atendido"] }, 1, 0] } },
                            cancelados: { $sum: { $cond: [{ $eq: ["$status", "cancelado"] }, 1, 0] } }
                        }
                    }
                ]),
                Patient.countDocuments({
                    ...(clinicObjectId ? { clinicaId: clinicObjectId } : { profissionalId: professionalObjectId }),
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                }),
                Appointment.aggregate([
                    {
                        $match: {
                            ...scopeFilter,
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
                            ...scopeFilter,
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
                    ...scopeFilter,
                    appointmentDate: { $gte: startOfDay, $lte: endOfDay }
                })
                .populate('patientId', 'name')
                .sort({ appointmentDate: 1 })
                .lean(),
                Appointment.aggregate([
                    {
                        $match: {
                            ...scopeFilter,
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
                ]),
                Appointment.aggregate([
                    {
                        $match: {
                            ...scopeFilter,
                            appointmentDate: { $gte: startOfWeek, $lte: endOfWeek }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                dayOfWeek: { $dayOfWeek: '$appointmentDate' },
                                status: '$status'
                            },
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

            const weeklyStatusByDayMapped = weeklyStatusByDay.map((item) => ({
                dayOfWeek: item._id.dayOfWeek,
                status: item._id.status,
                total: item.total
            }));

            const baseSummary = {
                dashboardPlan: subscriptionPlan,
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
                weeklyStatusByDay: weeklyStatusByDayMapped,
                agendaHoje: agendaToday.map(item => ({
                    _id: item._id,
                    patientName: item.patientId?.name || 'Paciente sem nome',
                    appointmentDate: item.appointmentDate,
                    status: item.status,
                    notes: item.notes || ''
                }))
            };

            if (subscriptionPlan !== 'professional') {
                return baseSummary;
            }

            const user = await User.findById(userId).select('valorParticularPadrao').lean();
            const defaultPrice = user?.valorParticularPadrao;
            const hasProfessionalPrice = defaultPrice !== null && defaultPrice !== undefined;

            const topPatientsRaw = await Appointment.aggregate([
                {
                    $match: {
                        ...scopeFilter,
                        status: 'atendido',
                        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth }
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
                    $group: {
                        _id: '$patientId',
                        patientName: { $first: '$patient.name' },
                        totalAtendimentos: { $sum: 1 }
                    }
                },
                { $sort: { totalAtendimentos: -1, patientName: 1 } },
                { $limit: 5 }
            ]);

            const topPatientsMonth = topPatientsRaw.map((item) => {
                const fullName = String(item.patientName || 'Paciente sem nome').trim();
                const nameParts = fullName.split(/\s+/).filter(Boolean);
                const shortName = nameParts.length >= 2
                    ? `${nameParts[0]} ${nameParts[1]}`
                    : (nameParts[0] || 'Paciente sem nome');

                return {
                    patientId: item._id,
                    patientName: shortName,
                    atendimentos: item.totalAtendimentos,
                    estimativa: hasProfessionalPrice ? Number((item.totalAtendimentos * defaultPrice).toFixed(2)) : null
                };
            });

            const attendedByMonthRaw = await Appointment.aggregate([
                {
                    $match: {
                        ...scopeFilter,
                        status: 'atendido',
                        appointmentDate: { $gte: startOfFourMonthsWindow, $lte: endOfCurrentMonth }
                    }
                },
                {
                    $project: {
                        year: { $year: '$appointmentDate' },
                        month: { $month: '$appointmentDate' }
                    }
                },
                {
                    $group: {
                        _id: { year: '$year', month: '$month' },
                        atendimentos: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
            const attendedByKey = new Map(
                attendedByMonthRaw.map((row) => {
                    const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
                    return [key, row.atendimentos];
                })
            );

            const recentFourMonths = [];
            for (let offset = 3; offset >= 0; offset -= 1) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
                const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
                const atendimentos = attendedByKey.get(key) || 0;

                recentFourMonths.push({
                    mes: key,
                    label: monthFormatter.format(monthDate).replace('.', ''),
                    atendimentos,
                    estimativa: hasProfessionalPrice ? Number((atendimentos * defaultPrice).toFixed(2)) : null
                });
            }

            return {
                ...baseSummary,
                professionalDefaultPrice: hasProfessionalPrice ? defaultPrice : null,
                professionalHasPrice: hasProfessionalPrice,
                professionalTopPatientsMonth: topPatientsMonth,
                professionalReturnsByMonth: recentFourMonths,
                professionalFinancialDisclaimer: 'Estimativa baseada no valor particular padrão configurado em Meus dados profissionais.'
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