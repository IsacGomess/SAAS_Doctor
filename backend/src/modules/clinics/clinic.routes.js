const express = require('express');
const routes = express.Router();
const clinicController = require('./clinic.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter = require('../../middlewares/rate-limit.js');

routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

routes.post('/', clinicController.createClinica);
routes.get('/me', clinicController.getMyClinica);

module.exports = routes;
