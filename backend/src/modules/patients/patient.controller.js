const { ZodError } = require('zod');
const PatientService = require('./patient.service.js');
const {
  registerPatientSchema,
  medicalRecordSchema,
  evolutionSchema,
  prescriptionSchema,
  patientIdParamSchema
} = require('./patient.validator.js');

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
    const patient = await PatientService.findPatientById(patientId);
    if (!canAccessPatient(req, patient)) {
      return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
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
    const patient = await PatientService.findPatientById(evolutionData.patientId);
    if (!canAccessPatient(req, patient)) {
      return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
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
    const patient = await PatientService.findPatientById(prescriptionData.patientId);
    if (!canAccessPatient(req, patient)) {
      return res.status(403).json({ success: false, message: 'Acesso negado a este paciente' });
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
