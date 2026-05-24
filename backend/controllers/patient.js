const { Patient, MedicalRecord, Evolution ,Prescription} = require('../models');
const {z} = require('zod');

const pacienteSchema = z.object({
    name: z.string()
        .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
        .max(100, { message: "O nome não pode passar de 100 caracteres" })
        .transform(val => val.trim()), // Remove espaços extras (não força minúsculas)

    cpf: z.string()
        .transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')) // Remove pontos/traços vindo do front
        .refine(val => val.length === 11, { message: 'CPF inválido. Envie 11 dígitos (ex: 000.000.000-00 ou 00000000000).' }),

    phone: z.string()
        .transform(val => (typeof val === 'string' ? val.replace(/[^0-9]/g, '') : '')) // Remove parênteses/traços do telefone
        .refine(val => val.length >= 10 && val.length <= 11, { message: 'Telefone inválido. Envie DDD + número (10 ou 11 dígitos).' }),

    observations: z.string()
        .max(500, { message: 'As observações não podem passar de 500 caracteres' })
        .optional()
        .transform(val => val ? val.trim() : ""), // Se não enviar nada, vira string vazia limpa

    isPresent: z.boolean().default(true) // Se o front esquecer, assume true por padrão
});

exports.registerPatient = async (req, res) => {

    console.log('🔵 registerPatient called', { userId: req.userId, clinicaId: req.clinicaId });
    const validation = pacienteSchema.safeParse(req.body);

    if (!validation.success) {
        console.warn('❌ registerPatient validation failed:', validation.error.flatten().fieldErrors);
        return res.status(400).json({ 
            success: false,
            message: 'Dados inválidos enviados para o cadastro.', 
            errors: validation.error.flatten().fieldErrors // Retorna exatamente qual campo falhou
        });
    }
    const {name, cpf, phone, observations, isPresent} = validation.data; // Dados já validados e transformados
    try {
        // Requer usuário autenticado
        if (!req.userId) {
            console.log('❌ registerPatient: usuário não autenticado');
            return res.status(401).json({ success: false, message: 'Usuário não autenticado/User not authenticated' });
        }

        // Decidir associação: se usuário tem clinicaId, vincula ao clinica, senão vincula ao profissional (criador)
        const patientData = { name, cpf, phone, observations, isPresent };
        if (req.clinicaId) {
            patientData.clinicaId = req.clinicaId;
        } else {
            // Quando não há clinica, associa ao profissional que está criando
            patientData.profissionalId = req.userId;
        }

        console.log('🔵 registerPatient - patientData:', patientData);

        const newPatient = await Patient.create(patientData);

        return res.status(201).json({ success: true, message: 'Paciente registrado com sucesso/Patient registered successfully', patient: newPatient });
    } catch (error) {
        console.error('❌ Erro ao registrar paciente:', error);
        return res.status(500).json({ message: 'Erro ao registrar paciente/Error registering patient', error: error.message });
    }
};


exports.getPatients = async (req, res) => {
    try {
        // Se o usuário pertence a uma clínica, retorna pacientes da clínica
        // além dos pacientes privados (sem clinica) vinculados ao próprio profissional
        let filter = { isPresent: true };
        if (req.clinicaId) {
            filter = {
                isPresent: true,
                $or: [
                    { clinicaId: req.clinicaId },
                    { clinicaId: null, profissionalId: req.userId }
                ]
            };
        } else {
            // Usuário sem clínica - mostra apenas pacientes vinculados ao profissional
            filter = { isPresent: true, profissionalId: req.userId };
        }

        const patients = await Patient.find(filter).sort({ createdAt: -1 });
        if(!patients || patients.length === 0) {
            return res.status(200).json({ success: true, patients: [] });
        }
        return res.status(200).json({ success: true, patients });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao obter pacientes/Error fetching patients', error: error.message });
    }
};

// Helper: verifica se req.user pode acessar o paciente
const canAccessPatient = (req, patient) => {
    if (!patient) return false;
    // Se paciente pertence a uma clínica, só usuários dessa clínica acessam
    if (patient.clinicaId) {
        return req.clinicaId && patient.clinicaId.toString() === req.clinicaId.toString();
    }
    // Se paciente é privado, só o profissional dono pode acessar
    if (patient.profissionalId) {
        return req.userId && patient.profissionalId.toString() === req.userId.toString();
    }
    return false;
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
        // Verificar acesso ao paciente primeiro
        const patient = await Patient.findById(patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente/Access to this patient denied' });
        }
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
        // Verificar acesso ao paciente
        const patient = await Patient.findById(patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente/Access to this patient denied' });
        }
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
        // Verificar acesso ao paciente
        const patient = await Patient.findById(patientId);
        if (!canAccessPatient(req, patient)) {
            return res.status(403).json({ success: false, message: 'Acesso negado a este paciente/Access to this patient denied' });
        }
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
