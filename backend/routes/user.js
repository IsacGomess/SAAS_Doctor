const express = require('express');
const routes = require('express').Router();
const userController = require('../controllers/user');
const patientController = require('../controllers/patient');
const authMiddleware = require('../middlewares/auth');
const limiter  = require('../middlewares/rate-limit'); // Importa o middleware de rate limiting

// Rotas públicas (sem autenticação)
routes.post('/register',limiter.authLimiter,  userController.register);
routes.post('/login',limiter.authLimiter, userController.login);

// Middleware de autenticação para as rotas seguintes
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// Rotas protegidas (requerem autenticação)
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);

routes.get('/patients/atendance-list',  patientController.getPatients);

routes.post('/patients/register-patient', patientController.registerPatient);

routes.post('/patients/create-medical-record',  patientController.medicalRecord);

routes.get('/patients/:patientId/get-medical-records',  patientController.getMedicalRecords);

routes.post('/patients/create-evolution',  patientController.evolution);

routes.get('/patients/:patientId/get-evolutions',  patientController.getEvolutions);

routes.post('/patients/create-prescription',  patientController.prescription);

routes.get('/patients/:patientId/get-prescriptions',  patientController.getPrescriptions);


module.exports = routes;

