const express = require('express');
const routes = express.Router();
const reportsController = require('./report.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

// 1. Aplica os middlewares globais para todo este grupo de rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);


// Todas as rotas passam pelo middleware que lê o cookie de sessão seguro
routes.get('/appointments-monthly',  reportsController.getAppointmentsMonthly);
routes.get('/patients-growth', reportsController.getPatientsGrowth);
routes.get('/wait-time-monthly',  reportsController.getWaitTimeMonthly);
routes.get('/plans-monthly', reportsController.getPlansMonthly);
routes.get('/dashboard-summary', reportsController.getDashboardSummary);
routes.get('/plans-weekly', reportsController.getPlansWeekly);

module.exports = routes;