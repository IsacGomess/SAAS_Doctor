const express = require('express');
const app = express();
const routes = require('express').Router();
const userController = require('../controllers/user');
const patientController = require('../controllers/patient');
const authMiddleware = require('../middlewares/auth');

// Rota para registro  padrão standart MVC
routes.post('/user/register', userController.register);
// Rota para login
routes.post('/user/login',userController.login);


app.use(authMiddleware.authenticateToken); // Middleware para proteger as rotas seguintes

routes.get('/patients/atendance-list',  patientController.getPatients);

routes.post('/patients/register-patient', patientController.registerPatient);

routes.post('/patients/create-medical-record',  patientController.medicalRecord);

routes.get('/patients/:patientId/get-medical-records',  patientController.getMedicalRecords);

routes.post('/patients/create-evolution',  patientController.evolution);

routes.get('/patients/:patientId/get-evolutions',  patientController.getEvolutions);

routes.post('/patients/create-prescription',  patientController.prescription);

routes.get('/patients/:patientId/get-prescriptions',  patientController.getPrescriptions);


module.exports = routes;

