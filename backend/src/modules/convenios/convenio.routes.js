const express = require('express');
const routes = express.Router();
const convenioController = require('./convenio.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

routes.get('/list', convenioController.listConveniosByClinica);
routes.post('/create', convenioController.createConvenio);
routes.put('/:convenioId/toggle', convenioController.toggleConvenioStatus);

module.exports = routes;
