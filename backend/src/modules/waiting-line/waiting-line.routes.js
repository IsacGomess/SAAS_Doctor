const express = require('express');
const routes = express.Router();
const waitingLineController = require('./waiting-line.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const requireActiveSubscription = require('../../middlewares/requireActiveSubscription.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter = require('../../middlewares/rate-limit.js');

// Middleware de autenticação para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(requireActiveSubscription);
routes.use(csrfMiddleware.validateOrigin);
routes.use(csrfMiddleware.doubleCsrfProtection);

// Criar nova entrada na fila de espera
routes.post('/create', waitingLineController.createWaitingLineEntry);

// Listar fila de espera com filtros opcionais
routes.get('/list', waitingLineController.getWaitingLine);

// Obter entrada específica da fila
routes.get('/:id', waitingLineController.getWaitingLineById);

// Chamar paciente (atualizar status para chamado)
routes.patch('/:id/call', waitingLineController.callPatient);

// Atualizar status da entrada na fila
routes.patch('/:id/status', waitingLineController.updateWaitingLineStatus);

// Cancelar entrada na fila
routes.patch('/:id/cancel', waitingLineController.cancelWaitingLine);

module.exports = routes;
