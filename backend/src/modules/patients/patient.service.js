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
                    { clinicaId: null, profesionalId: userId } // Correção do campo profissionalId
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
            vitalSigns: recordData.vitalSigns
        });
    }

    async getMedicalRecords(patientId) {
        return await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });
    }

    // --- MÉTODOS DE EVOLUÇÃO ---
    async createEvolution(evolutionData, userId) {
        return await Evolution.create({
            patientId: evolutionData.patientId,
            belongsTo: userId,
            diagnosis: evolutionData.diagnosis,
            vitalSigns: evolutionData.vitalSigns
        });
    }

    async getEvolutions(patientId) {
        return await Evolution.find({ patientId }).sort({ createdAt: -1 });
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
        return await Prescription.find({ patientId }).sort({ createdAt: -1 });
    }
}

module.exports = new PatientService();