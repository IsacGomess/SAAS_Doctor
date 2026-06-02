// src/modules/patients/patient.controller.js
const { z } = require('zod');
const PatientService = require('./patient.service.js'); // Única importação necessária

const pacienteSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }).max(100).transform(val => val.trim()),
    cpf: z.string().transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')).refine(val => val.length === 11, { message: 'CPF inválido.' }),
    phone: z.string().transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')).refine(val => val.length >= 10 && val.length <= 11, { message: 'Telefone inválido.' }),
    observations: z.string().max(500).optional().transform(val => val ? val.trim() : ""),
    isPresent: z.boolean().default(true)
});

// Helper de segurança continua no controller por ser uma regra de acesso HTTP uma funçao de verificaçao 
const canAccessPatient = (req, patient) => {
    if (!patient) return false;
    if (patient.clinicaId) {
        return req.clinicaId && patient.clinicaId.toString() === req.clinicaId.toString();
    }
    if (patient.profissionalId) {
        return req.userId && patient.profissionalId.toString() === req.userId.toString();
    }
    return false;
};

exports.registerPatient = async (req, res) => {
    if (!req.userId) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const validation = pacienteSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, message: 'Dados inválidos.', errors: validation.error.flatten().fieldErrors });
    }

    try {
        // ✅ Delega a criação e lógica de IDs para o Service
        const newPatient = await PatientService.registerPatient(validation.data, req.userId, req.clinicaId);
        return res.status(201).json({ success: true, message: 'Paciente registrado com sucesso', patient: newPatient });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar paciente', error: error.message });
    }
};

exports.getPatients = async (req, res) => {
    try {
        // ✅ O controller não sabe como o banco busca, ele só pede a lista
        const patients = await PatientService.getPatients(req.userId, req.clinicaId);
        return res.status(200).json({ success: true, patients });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter pacientes', error: error.message });
    }
};

exports.medicalRecord = async (req, res) => {
    try {
        const newDataPatient = await PatientService.createMedicalRecord(req.body, req.userId);
        return res.status(201).json({ success: true, message: 'Dados do paciente registrados com sucesso', dataPatient: newDataPatient });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar dados do paciente', error: error.message });
    }
};

exports.getMedicalRecords = async (req, res) => {
    try {
        const patient = await PatientService.findPatientById(req.params.patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
        }

        const records = await PatientService.getMedicalRecords(req.params.patientId);
        if (!records || records.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhum registro médico encontrado' });
        }

        return res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter dados do paciente', error: error.message });
    }
};

exports.evolution = async (req, res) => {
    try {
        const patient = await PatientService.findPatientById(req.body.patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
        }

        const newEvolution = await PatientService.createEvolution(req.body, req.userId);
        return res.status(201).json({ success: true, message: 'Evolução registrada com sucesso', evolutions: newEvolution });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar evolução', error: error.message });
    }
};

exports.getEvolutions = async (req, res) => {
    try {
        const evolutions = await PatientService.getEvolutions(req.params.patientId);
        if (!evolutions || evolutions.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhuma evolução encontrada' });
        }
        return res.status(200).json({ success: true, count: evolutions.length, evolutions });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter evolução', error: error.message });
    }
};

exports.prescription = async (req, res) => {
    try {
        const patient = await PatientService.findPatientById(req.body.patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
        }

        const newPrescription = await PatientService.createPrescription(req.body, req.userId);
        return res.status(201).json({ success: true, message: 'Prescrição registrada com sucesso', prescription: newPrescription });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar prescrição', error: error.message });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await PatientService.getPrescriptions(req.params.patientId);
        if (!prescriptions || prescriptions.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhuma prescrição encontrada' });
        }
        return res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter prescrições', error: error.message });
    }
};