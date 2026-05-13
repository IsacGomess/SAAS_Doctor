const { get } = require('mongoose'); // Importa o método get do Mongoose, embora não seja utilizado neste código. Pode ser removido se não for necessário.
const { Patient, MedicalRecord, Evolution ,Prescription} = require('../models');




exports.registerPatient = async (req, res) => {
    try {
        const { name, cpf, phone, observations, isPresent } = req.body;
        const newPatient = await Patient.create({ name, cpf, phone, observations, isPresent });

        return res.status(201).json({ success: true, message: 'Paciente registrado com sucesso/Patient registered successfully', patient: newPatient });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar paciente/Error registering patient', error: error.message });
    }
};


exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find({isPresent: true}).sort({ createdAt: -1 }); // Ordena por data de criação, do mais recente para o mais antigo
        if(!patients || patients.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhum paciente presente no momento/No patients present at the moment' });
        }
        return res.status(200).json({ success: true, patients });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter pacientes/Error fetching patients', error: error.message });
    }
};


exports.medicalRecord = async (req, res) => {
    try {
        const { patientId, quickHistory, diagnosis, vitalSigns } = req.body;
        const belongsTo = req.userId; // Supondo que o ID do médico esteja disponível no token de autenticação
        const newDataPatient = await MedicalRecord.create({ patientId, belongsTo, quickHistory, diagnosis, vitalSigns});
        return res.status(201).json({ success: true, message: 'Dados do paciente registrados com sucesso', dataPatient: newDataPatient });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar dados do paciente', error: error.message });
    }
};



exports.getMedicalRecords = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }); // Ordena por data de criação, do mais recente para o mais antigo
        if(!records || records.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhum registro médico encontrado para este paciente/No medical records found for this patient' });
        }

        return res.status(200).json({ success: true,count:records.length,records });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter dados do paciente', error: error.message });
    }
};


exports.evolution = async (req, res) => {
    try {
        const {patientId, diagnosis,vitalSigns } = req.body;
        const belongsTo = req.userId; // Supondo que o ID do médico esteja disponível no token de autenticação
        const newEvolution = await Evolution.create({ patientId, belongsTo, diagnosis, vitalSigns });
        return res.status(201).json({ success: true, message: 'Evolução registrada com sucesso', evolutions: newEvolution });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar evolução', error: error.message });
    }
};

exports.getEvolutions = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const evolutions = await Evolution.find({ patientId }).sort({ createdAt: -1 }); // Ordena por data de criação, do mais recente para o mais antigo
        
        if(!evolutions || evolutions.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhuma evolução encontrada para este paciente/No evolutions found for this patient' });
        }

        return res.status(200).json({ success: true,count: evolutions.length,evolutions });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter evolução', error: error.message });
    }
};

exports.prescription = async (req, res) => { 
    try {
        const { patientId, diagnosis, medications, observations } = req.body;
        const belongsTo = req.userId; // Supondo que o ID do médico esteja disponível no token de autenticação
        const newPrescription = await Prescription.create({ patientId, belongsTo, diagnosis, medications, observations });
        return res.status(201).json({ success: true, message: 'Prescrição registrada com sucesso', prescription: newPrescription });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar prescrição', error: error.message });
    }
};

exports.getPrescriptions = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const prescriptions = (await Prescription.find({ patientId })).sort({ createdAt: -1 });
        if(!prescriptions || prescriptions.length === 0) {
            return res.status(404).json({ success: true, message: 'Nenhuma prescrição encontrada para este paciente/No prescriptions found for this patient' });
        }
        
        return res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter prescrições', error: error.message });
    }
};
