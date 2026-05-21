const { Patient, MedicalRecord, Evolution ,Prescription} = require('../models');
const {z} = require('zod');

const pacienteSchema = z.object({
    name: z.string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome não pode passar de 100 caracteres")
        .transform(val => val.trim().toLowerCase()), // Remove espaços extras e padroniza minúsculo
    
    cpf: z.string()
        .transform(val => val.replace(/[^0-9]/g, '')) // Remove pontos/traços vindo do front
        .refine(val => val.length === 11, "O CPF deve ter exatamente 11 dígitos"),
    
    phone: z.string()
        .transform(val => val.replace(/[^0-9]/g, '')) // Remove parênteses/traços do telefone
        .refine(val => val.length >= 10 && val.length <= 11, "Telefone inválido (deve ter 10 ou 11 dígitos)"),
    
    observations: z.string()
        .max(500, "As observações não podem passar de 500 caracteres")
        .optional()
        .transform(val => val ? val.trim() : ""), // Se não enviar nada, vira string vazia limpa
    
    isPresent: z.boolean().default(true) // Se o front esquecer, assume true por padrão
});

exports.registerPatient = async (req, res) => {

    const validation = pacienteSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({ 
            success: false,
            message: 'Dados inválidos enviados para o cadastro.', 
            errors: validation.error.flatten().fieldErrors // Retorna exatamente qual campo falhou
        });
    }
    const {name, cpf, phone, observations, isPresent} = validation.data; // Dados já validados e transformados
    try {
        
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
