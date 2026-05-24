const express = require('express');
const routes = express.Router();
const waitingLineController = require('../controllers/waiting-line');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

// Middleware de autenticação para todas as rotas
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

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
