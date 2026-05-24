const express = require('express');
const routes = express.Router();
const clinicaController = require('../controllers/clinica');
const authMiddleware = require('../middlewares/auth');
const limiter = require('../middlewares/rate-limit');

routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

routes.post('/', clinicaController.createClinica);
routes.get('/me', clinicaController.getMyClinica);

module.exports = routes;
