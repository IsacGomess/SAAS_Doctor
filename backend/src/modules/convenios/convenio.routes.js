const express = require('express');
const routes = express.Router();
const convenioController = require('./convenio.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const requireActiveSubscription = require('../../middlewares/requireActiveSubscription.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter = require('../../middlewares/rate-limit.js');

routes.use(authMiddleware.authenticateToken);
routes.use(requireActiveSubscription);
routes.use(csrfMiddleware.validateOrigin);
routes.use(csrfMiddleware.doubleCsrfProtection);

routes.get('/list', convenioController.listConveniosByClinica);
routes.post('/create', convenioController.createConvenio);
routes.put('/:convenioId/toggle', convenioController.toggleConvenioStatus);

module.exports = routes;
