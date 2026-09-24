const express = require('express');
const routes = express.Router();
const clinicController = require('./clinic.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter = require('../../middlewares/rate-limit.js');

routes.use(authMiddleware.authenticateToken);
routes.use(csrfMiddleware.validateOrigin);
routes.use(csrfMiddleware.doubleCsrfProtection);

routes.post('/', clinicController.createClinica);
routes.get('/me', clinicController.getMyClinica);

module.exports = routes;
