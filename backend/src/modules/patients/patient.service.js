// src/modules/patients/patient.service.js
const Patient = require('./patient.model.js');
const MedicalRecord = require('./medicalRecord.model.js');
const Evolution = require('./evolution.model.js');
const Prescription = require('./prescription.model.js');

class PatientService {
    // Busca um paciente por ID para checar permissões
    async findPatientById(patientId) {
        return await Patient.findById(patientId);
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

    // Monta o filtro complexo do MongoDB e busca a lista de pacientes
    async getPatients(userId, clinicaId) {
        let filter = { isPresent: true };
        if (clinicaId) {
            filter = {
                isPresent: true,
                $or: [
                    { clinicaId: clinicaId },
                    { clinicaId: null, profissionalId: userId } // Correção do campo profissionalId
                ]
            };
        } else {
            filter = { isPresent: true, profissionalId: userId };
        }
        return await Patient.find(filter).sort({ createdAt: -1 });
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
            .sort({ createdAt: -1 });
    }

    // Marca um item (evolução, prontuário ou prescrição) como cancelado (visual), registra quem e quando
    async cancelItem(patientId, type, itemId, userId) {
        let Model;
        if (type === 'evolution') Model = Evolution;
        else if (type === 'medicalRecord') Model = MedicalRecord;
        else if (type === 'prescription') Model = Prescription;
        else throw new Error('Tipo inválido');

        const doc = await Model.findOne({ _id: itemId, patientId });
        if (!doc) throw new Error('Item não encontrado');

        doc.canceled = true;
        doc.canceledAt = new Date();
        doc.canceledBy = userId;

        await doc.save();
        // Popula usuário que cancelou antes de retornar
        return await Model.findById(doc._id).populate('canceledBy', 'name registroProf');
    }
}

module.exports = new PatientService();