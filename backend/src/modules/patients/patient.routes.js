const express = require('express');
const routes = express.Router();
const patientController = require('./patient.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// Middleware de autenticação para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// Rotas de pacientes
routes.get('/atendance-list', patientController.getPatients);
routes.post('/register-patient', patientController.registerPatient);
routes.post('/create-medical-record', patientController.medicalRecord);
routes.get('/:patientId/get-medical-records', patientController.getMedicalRecords);
routes.post('/create-evolution', patientController.evolution);
routes.get('/:patientId/get-evolutions', patientController.getEvolutions);
routes.post('/create-prescription', patientController.prescription);
routes.get('/:patientId/get-prescriptions', patientController.getPrescriptions);

module.exports = routes;
