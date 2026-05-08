const routes = require('express').Router();
const userController = require('../controllers/user');
const authMiddleware = require('../middlewares/auth');

// Rota para registro de médico standart MVC
routes.post('/register', userController.registerDoctor);

routes.post('/login',userController.login);

// Rota protegida - requer token de autenticação
//routes.get('/profile', authMiddleware.authenticateToken, userController.getProfile);

module.exports = routes;

