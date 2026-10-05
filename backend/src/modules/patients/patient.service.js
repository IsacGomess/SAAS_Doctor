// src/modules/patients/patient.service.js
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');
const Appointment = require('../appointments/appointment.model.js');
const PatientCharge = require('./patient-financial.model.js');

const resolveClinicalModel = (type) => {
    if (type === 'evolution') return Evolution;
    if (type === 'medicalRecord') return MedicalRecord;
    if (type === 'prescription') return Prescription;
    return null;
};

class PatientService {
    // Busca um paciente por ID para checar permissões
    async findPatientById(patientId) {
        return await Patient.findById(patientId);
    }

    // Busca um paciente garantindo que o usuário (userId) ou a clínica (clinicaId)
    // tenham acesso a ele. Retorna null se não acessível.
    async findAccessiblePatient(patientId, userId, clinicaId) {
        const accessFilter = clinicaId
            ? {
                $or: [
                    { clinicaId: clinicaId },
                    { clinicaId: null, profissionalId: userId }
                ]
            }
            : { clinicaId: null, profissionalId: userId };

        return await Patient.findOne({ _id: patientId, ...accessFilter });
    }

    // Registra o paciente decidindo se vai para clínica ou profissional privado
    async registerPatient(patientData, userId, clinicaId) {
        const finalData = { ...patientData };
        if (clinicaId) {
            finalData.clinicaId = clinicaId;
        } else {
            finalData.profissionalId = userId;
        }
        return await Patient.create(finalData);
    }

    async updatePatient(patientId, userId, clinicaId, patientData) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) {
            throw new Error('PATIENT_NOT_FOUND');
        }

        const updateData = { ...patientData };
        if (updateData.convenioId === undefined) {
            delete updateData.convenioId;
        }

        if (Object.prototype.hasOwnProperty.call(updateData, 'cpf') && updateData.cpf === '') {
            delete updateData.cpf;
        }

        return await Patient.findByIdAndUpdate(
            patientId,
            { $set: updateData },
            { new: true }
        );
    }

    // Monta o filtro complexo do MongoDB e busca a lista de pacientes
    async getPatients(userId, clinicaId) {
        let filter = { isPresent: true };
        if (clinicaId) {
            filter = {
                isPresent: true,
                $or: [
                    { clinicaId: clinicaId },
                    { clinicaId: null, profissionalId: userId }
                ]
            };
        } else {
            filter = { isPresent: true, profissionalId: userId };
        }
        return await Patient.find(filter).sort({ createdAt: -1 });
    }

    async getPatientsPage(userId, clinicaId, options = {}) {
        const page = Number(options.page) > 0 ? Number(options.page) : 1;
        const limit = Number(options.limit) > 0 ? Math.min(Number(options.limit), 100) : 20;
        const search = (options.search || '').trim();

        let filter = { isPresent: true };
        if (clinicaId) {
            filter = {
                isPresent: true,
                $or: [
                    { clinicaId: clinicaId },
                    { clinicaId: null, profissionalId: userId }
                ]
            };
        } else {
            filter = { isPresent: true, profissionalId: userId };
        }

        if (search) {
            const searchPattern = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
            filter.$and = [{ $or: [{ name: searchPattern }, { cpf: searchPattern }] }];
        }

        const total = await Patient.countDocuments(filter);
        const patients = await Patient.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
            patients
        };
    }

    async getPatientFinancialSummary(patientId, userId, clinicaId, monthString) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) throw new Error('PATIENT_NOT_FOUND');

        const safeMonth = monthString || this.getCurrentMonthKey();
        const [year, month] = safeMonth.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);

        const scopeFilter = clinicaId ? { clinicaId } : { clinicaId: null, profissionalId: userId };

        const attendedInMonth = await Appointment.countDocuments({
            patientId,
            ...scopeFilter,
            status: 'atendido',
            appointmentDate: { $gte: monthStart, $lt: monthEnd }
        });

        const attendedTotal = await Appointment.countDocuments({
            patientId,
            ...scopeFilter,
            status: 'atendido'
        });

        const charges = await PatientCharge.find({
            patientId,
            ...scopeFilter,
            referenceMonth: safeMonth
        }).sort({ dueDate: 1 }).lean();

        const totalCharged = charges.reduce((sum, charge) => sum + (Number(charge.amountCents) || 0), 0);
        const totalReceived = charges.reduce((sum, charge) => sum + (charge.payments || []).reduce((inner, payment) => inner + (Number(payment.amountCents) || 0), 0), 0);

        return {
            patientName: patient.name,
            month: safeMonth,
            attendedInPeriod: attendedInMonth,
            attendedTotal,
            totalCharged,
            totalReceived,
            balancePending: totalCharged - totalReceived,
            charges: charges.map((charge) => ({
                ...charge,
                amountCents: Number(charge.amountCents || 0),
                payments: (charge.payments || []).map((payment) => ({
                    ...payment,
                    amountCents: Number(payment.amountCents || 0)
                }))
            }))
        };
    }

    async getPatientCharges(patientId, userId, clinicaId) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) throw new Error('PATIENT_NOT_FOUND');

        const scopeFilter = clinicaId ? { clinicaId } : { clinicaId: null, profissionalId: userId };
        return await PatientCharge.find({ patientId, ...scopeFilter }).sort({ dueDate: -1 }).lean();
    }

    async createPatientCharge(patientId, userId, clinicaId, payload) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) throw new Error('PATIENT_NOT_FOUND');

        const description = String(payload?.description || '').trim();
        const safeReferenceMonth = /^\d{4}-\d{2}$/.test(String(payload?.referenceMonth || '').trim())
            ? payload.referenceMonth
            : this.getCurrentMonthKey();

        const amountValue = Number(payload?.amountCents);
        if (!description) throw new Error('INVALID_CHARGE_DESCRIPTION');
        if (!Number.isFinite(amountValue) || amountValue <= 0) throw new Error('INVALID_CHARGE_AMOUNT');

        const dueDate = new Date(payload?.dueDate);
        if (Number.isNaN(dueDate.getTime())) throw new Error('INVALID_DUE_DATE');

        const scopeFilter = clinicaId ? { clinicaId } : { clinicaId: null, profissionalId: userId };
        const conflict = await PatientCharge.findOne({
            patientId,
            ...scopeFilter,
            description,
            referenceMonth: safeReferenceMonth,
            dueDate
        });

        if (conflict) {
            throw new Error('DUPLICATE_CHARGE');
        }

        const charge = await PatientCharge.create({
            patientId,
            clinicaId: clinicaId || null,
            profissionalId: clinicaId ? null : userId,
            description,
            periodicity: payload.periodicity,
            referenceMonth: safeReferenceMonth,
            amountCents: amountValue,
            dueDate,
            status: 'pendente',
            overdue: false
        });

        return charge.toObject();
    }

    async updatePatientCharge(patientId, chargeId, userId, clinicaId, payload) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) throw new Error('PATIENT_NOT_FOUND');

        const scopeFilter = clinicaId ? { clinicaId } : { clinicaId: null, profissionalId: userId };
        const charge = await PatientCharge.findOne({ _id: chargeId, patientId, ...scopeFilter });
        if (!charge) throw new Error('CHARGE_NOT_FOUND');

        if (payload.description) charge.description = payload.description.trim();
        if (payload.periodicity) charge.periodicity = payload.periodicity;
        if (payload.referenceMonth) charge.referenceMonth = payload.referenceMonth;
        if (payload.amountCents) charge.amountCents = Number(payload.amountCents);
        if (payload.dueDate) charge.dueDate = new Date(payload.dueDate);

        await charge.validate();
        await charge.save();
        return charge.toObject();
    }

    async addPaymentToCharge(patientId, chargeId, userId, clinicaId, payload) {
        const patient = await this.findAccessiblePatient(patientId, userId, clinicaId);
        if (!patient) throw new Error('PATIENT_NOT_FOUND');

        const scopeFilter = clinicaId ? { clinicaId } : { clinicaId: null, profissionalId: userId };
        const charge = await PatientCharge.findOne({ _id: chargeId, patientId, ...scopeFilter });
        if (!charge) throw new Error('CHARGE_NOT_FOUND');

        const currentPaid = (charge.payments || []).reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);
        const nextTotal = currentPaid + Number(payload.amountCents);
        if (nextTotal > Number(charge.amountCents)) {
            throw new Error('PAYMENT_EXCEEDS_CHARGE');
        }

        charge.payments.push({
            amountCents: Number(payload.amountCents),
            paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
            method: payload.method
        });

        await charge.validate();
        await charge.save();
        return charge.toObject();
    }

    getCurrentMonthKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    // --- MÉTODOS DO PRONTUÁRIO (MEDICAL RECORDS) ---
    async createMedicalRecord(recordData, userId) {
        return await MedicalRecord.create({
            patientId: recordData.patientId,
            belongsTo: userId,
            quickHistory: recordData.quickHistory,
            diagnosis: recordData.diagnosis,
        });
    }

    async getMedicalRecords(patientId) {
        return await MedicalRecord.find({ patientId })
            .populate('belongsTo', 'name registroProf')
            .populate('canceledBy', 'name registroProf')
            .populate('signingRecord.recordedBy', 'name registroProf')
            .sort({ createdAt: -1 });
    }

    // --- MÉTODOS DE EVOLUÇÃO ---
    async createEvolution(evolutionData, userId) {
        return await Evolution.create({
            patientId: evolutionData.patientId,
            belongsTo: userId,
            diagnosis: evolutionData.diagnosis,
            evolutionText: evolutionData.evolutionText,
            conduct: evolutionData.conduct,
            patientRecommendations: evolutionData.patientRecommendations
        });
    }

    async getEvolutions(patientId) {
        return await Evolution.find({ patientId })
            .populate('belongsTo', 'name registroProf')
            .populate('canceledBy', 'name registroProf')
            .populate('signingRecord.recordedBy', 'name registroProf')
            .sort({ createdAt: -1 });
    }

    // --- MÉTODOS DE PRESCRIÇÃO (RECEITAS) ---
    async createPrescription(prescriptionData, userId) {
        return await Prescription.create({
            patientId: prescriptionData.patientId,
            belongsTo: userId,
            diagnosis: prescriptionData.diagnosis,
            medications: prescriptionData.medications,
            observations: prescriptionData.observations
        });
    }

    async getPrescriptions(patientId) {
        return await Prescription.find({ patientId })
            .populate('belongsTo', 'name registroProf')
            .populate('canceledBy', 'name registroProf')
            .populate('signingRecord.recordedBy', 'name registroProf')
            .sort({ createdAt: -1 });
    }

    // Marca um item (evolução, prontuário ou prescrição) como cancelado (visual), registra quem e quando
    async cancelItem(patientId, type, itemId, userId) {
        const Model = resolveClinicalModel(type);
        if (!Model) throw new Error('Tipo inválido');

        const doc = await Model.findOne({ _id: itemId, patientId });
        if (!doc) throw new Error('Item não encontrado');

        doc.canceled = true;
        doc.canceledAt = new Date();
        doc.canceledBy = userId;

        await doc.save();
        // Popula usuário que cancelou antes de retornar
        return await Model.findById(doc._id).populate('canceledBy', 'name registroProf');
    }

    async signItem(patientId, type, itemId, userId) {
        const Model = resolveClinicalModel(type);
        if (!Model) throw new Error('Tipo inválido');

        const signed = await Model.findOneAndUpdate(
            {
                _id: itemId,
                patientId,
                canceled: { $ne: true },
                'signingRecord.completed': { $ne: true }
            },
            {
                $set: {
                    'signingRecord.completed': true,
                    'signingRecord.completedAt': new Date(),
                    'signingRecord.recordedBy': userId,
                    'signingRecord.method': 'signature_screen'
                }
            },
            {
                returnDocument: 'after'
            }
        ).populate('signingRecord.recordedBy', 'name registroProf');

        return signed;
    }
}

module.exports = new PatientService();