const { ZodError } = require('zod');
const PatientService = require('./patient.service.js');
const {
  registerPatientSchema,
  medicalRecordSchema,
  evolutionSchema,
  prescriptionSchema,
  patientIdParamSchema
  , cancelItemSchema
} = require('./patient.validator.js');

// Authorization is centralized in PatientService.findAccessiblePatient

const hasProfessionalPlan = (req) => req?.subscription?.plan === 'professional';

const isRecepcionistaWithoutProfessionalPlan = (req) => (
  req?.user?.role === 'recepcionista' && !hasProfessionalPlan(req)
);

const isMissingProfessionalRegistration = (req) => (
  !req?.user?.registroProf || !String(req.user.registroProf).trim()
);

const shouldRequireProfessionalRegistration = (req) => (
  req?.user && (req.user.role !== 'recepcionista' || hasProfessionalPlan(req))
);

const getRegistrationSettingsAreaText = (req) => (
  hasProfessionalPlan(req) ? 'na seção Meus dados profissionais' : 'na área da clínica'
);

exports.registerPatient = async (req, res) => {
  try {
    const validatedData = registerPatientSchema.parse(req.body);

    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const newPatient = await PatientService.registerPatient(validatedData, req.userId, req.clinicaId);
    return res.status(201).json({ success: true, message: 'Paciente registrado com sucesso', patient: newPatient });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao registrar paciente', error: error.message });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const patients = await PatientService.getPatients(req.userId, req.clinicaId);
    return res.status(200).json({ success: true, patients });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao obter pacientes', error: error.message });
  }
};

exports.medicalRecord = async (req, res) => {
  try {
    const recordData = medicalRecordSchema.parse(req.body);
    // Exige registro para cargos clínicos e para qualquer usuário no plano Professional.
    if (shouldRequireProfessionalRegistration(req) && isMissingProfessionalRegistration(req)) {
      return res.status(403).json({ success: false, message: `É necessário cadastrar número de registro profissional na sua conta antes de registrar dados no prontuário. Por favor, adicione seu número ${getRegistrationSettingsAreaText(req)}.` });
    }
    const patient = await PatientService.findAccessiblePatient(recordData.patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    const newDataPatient = await PatientService.createMedicalRecord(recordData, req.userId);
    return res.status(201).json({ success: true, message: 'Dados do paciente registrados com sucesso', dataPatient: newDataPatient });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao registrar dados do paciente', error: error.message });
  }
};

exports.getMedicalRecords = async (req, res) => {
  try {
    const { patientId } = patientIdParamSchema.parse(req.params);
    const patient = await PatientService.findAccessiblePatient(patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    // Recepcionistas só são bloqueados fora do plano Professional
    if (isRecepcionistaWithoutProfessionalPlan(req)) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const records = await PatientService.getMedicalRecords(patientId);
    if (!records || records.length === 0) {
      return res.status(404).json({ success: true, message: 'Nenhum registro médico encontrado' });
    }

    return res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao obter dados do paciente', error: error.message });
  }
};

exports.evolution = async (req, res) => {
  try {
    const evolutionData = evolutionSchema.parse(req.body);
    const patient = await PatientService.findAccessiblePatient(evolutionData.patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    // Recepcionistas só são bloqueados fora do plano Professional
    if (isRecepcionistaWithoutProfessionalPlan(req)) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // Exige registro para cargos clínicos e para qualquer usuário no plano Professional.
    if (shouldRequireProfessionalRegistration(req) && isMissingProfessionalRegistration(req)) {
      return res.status(403).json({ success: false, message: `É necessário cadastrar número de registro profissional na sua conta antes de registrar evoluções. Por favor, adicione seu número ${getRegistrationSettingsAreaText(req)}.` });
    }

    const newEvolution = await PatientService.createEvolution(evolutionData, req.userId);
    return res.status(201).json({ success: true, message: 'Evolução registrada com sucesso', evolutions: newEvolution });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao registrar evolução', error: error.message });
  }
};

exports.getEvolutions = async (req, res) => {
  try {
    const { patientId } = patientIdParamSchema.parse(req.params);
    // Recepcionistas só são bloqueados fora do plano Professional
    if (isRecepcionistaWithoutProfessionalPlan(req)) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // Exige registro para cargos clínicos e para qualquer usuário no plano Professional.
    if (shouldRequireProfessionalRegistration(req) && isMissingProfessionalRegistration(req)) {
      return res.status(403).json({ success: false, message: `É necessário cadastrar número de registro profissional na sua conta para visualizar evoluções. Por favor, adicione seu número ${getRegistrationSettingsAreaText(req)}.` });
    }

    const patient = await PatientService.findAccessiblePatient(patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    const evolutions = await PatientService.getEvolutions(patientId);
    if (!evolutions || evolutions.length === 0) {
      return res.status(404).json({ success: true, message: 'Nenhuma evolução encontrada' });
    }
    return res.status(200).json({ success: true, count: evolutions.length, evolutions });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao obter evolução', error: error.message });
  }
};

exports.prescription = async (req, res) => {
  try {
    const prescriptionData = prescriptionSchema.parse(req.body);
    const patient = await PatientService.findAccessiblePatient(prescriptionData.patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    // Recepcionistas só são bloqueados fora do plano Professional
    if (isRecepcionistaWithoutProfessionalPlan(req)) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // Exige registro para cargos clínicos e para qualquer usuário no plano Professional.
    if (shouldRequireProfessionalRegistration(req) && isMissingProfessionalRegistration(req)) {
      return res.status(403).json({ success: false, message: `É necessário cadastrar número de registro profissional na sua conta antes de registrar prescrições. Por favor, adicione seu número ${getRegistrationSettingsAreaText(req)}.` });
    }

    const newPrescription = await PatientService.createPrescription(prescriptionData, req.userId);
    return res.status(201).json({ success: true, message: 'Prescrição registrada com sucesso', prescription: newPrescription });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao registrar prescrição', error: error.message });
  }
};

exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId } = patientIdParamSchema.parse(req.params);
    // Recepcionistas só são bloqueados fora do plano Professional
    if (isRecepcionistaWithoutProfessionalPlan(req)) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }
    const patient = await PatientService.findAccessiblePatient(patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    const prescriptions = await PatientService.getPrescriptions(patientId);
    if (!prescriptions || prescriptions.length === 0) {
      return res.status(404).json({ success: true, message: 'Nenhuma prescrição encontrada' });
    }
    return res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido',
        errors: error.flatten().fieldErrors
      });
    }

    return res.status(500).json({ message: 'Erro ao obter prescrições', error: error.message });
  }
};

exports.cancelItem = async (req, res) => {
  try {
    const { patientId } = patientIdParamSchema.parse(req.params);
    const { itemId, type } = cancelItemSchema.parse(req.body);
    const patient = await PatientService.findAccessiblePatient(patientId, req.userId, req.clinicaId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente não encontrado' });
    }

    // Busca o documento para checar ownership
    let Model;
    if (type === 'evolution') Model = require('./evolution.model.js');
    else if (type === 'medicalRecord') Model = require('./medicalRecord.model.js');
    else if (type === 'prescription') Model = require('./prescription.model.js');
    else return res.status(400).json({ success: false, message: 'Tipo inválido' });

    const doc = await Model.findOne({ _id: itemId, patientId });
    if (!doc) return res.status(404).json({ success: false, message: 'Item não encontrado' });

    // Recepcionistas não podem cancelar
    if (req.user && req.user.role === 'recepcionista') {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    // Somente administrador ou autor do registro pode cancelar
    if (req.user && req.user.role !== 'administrador') {
      // owner check: documents store belongsTo
      if (!doc.belongsTo || doc.belongsTo.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: 'Apenas o autor ou administrador pode cancelar este item.' });
      }
    }

    const updated = await PatientService.cancelItem(patientId, type, itemId, req.userId);
    return res.status(200).json({ success: true, message: 'Item marcado como cancelado', item: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos.', errors: error.flatten().fieldErrors });
    }
    return res.status(500).json({ message: 'Erro ao cancelar item', error: error.message });
  }
};
