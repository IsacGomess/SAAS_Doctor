const express = require('express');
const routes = express.Router();
const AppointmentController = require('./appointment.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const requireActiveSubscription = require('../../middlewares/requireActiveSubscription.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter = require('../../middlewares/rate-limit.js');

// 1. Aplica os middlewares globais para todo este grupo de rotas
// 1. Aplica os middlewares globais para todo este grupo de rotas
routes.use(authMiddleware.authenticateToken);
routes.use(requireActiveSubscription);
routes.use(csrfMiddleware.validateOrigin);
routes.use(csrfMiddleware.doubleCsrfProtection);

// 2. Rotas limpas (o token já foi validado na linha de cima pelo .use)
routes.post('/create', AppointmentController.create);
routes.get('/list', AppointmentController.listByDate);
routes.patch('/:id/status', AppointmentController.updateStatus);

module.exports = routes;
