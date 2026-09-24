const express = require('express');
const routes = require('express').Router();
const userController = require('./user.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const requireActiveSubscription = require('../../middlewares/requireActiveSubscription.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter  = require('../../middlewares/rate-limit.js');
    

// Rotas públicas (sem autenticação)
routes.post('/register',limiter.authLimiter,  userController.register);
routes.post('/login',limiter.authLimiter, userController.login);
routes.post('/refresh', limiter.refreshLimiter, csrfMiddleware.validateOrigin, userController.refresh); 
routes.get('/csrf-token', userController.csrfToken);
routes.post('/logout', authMiddleware.authenticateToken, csrfMiddleware.validateOrigin, csrfMiddleware.doubleCsrfProtection, userController.logout);
routes.post('/forgot-password',limiter.forgotPasswordLimiter, userController.forgotPassword);
routes.post('/reset-password/:token',limiter.forgotPasswordLimiter, userController.resetPassword);

// Middleware de autenticação para as rotas seguintes
routes.use(authMiddleware.authenticateToken);
routes.use(requireActiveSubscription);
// Protege requisições mutáveis (POST/PUT/PATCH/DELETE) das rotas seguintes
routes.use(csrfMiddleware.validateOrigin);
routes.use(csrfMiddleware.doubleCsrfProtection);

// Rotas protegidas (requerem autenticação)
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);
routes.get('/me', userController.me);
routes.patch('/me', userController.updateMe);
routes.patch('/membros/:membroId', userController.updateMembro);

module.exports = routes;
