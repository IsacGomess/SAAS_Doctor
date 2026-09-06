const express = require('express');
const routes = require('express').Router();
const userController = require('./user.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter  = require('../../middlewares/rate-limit.js');
    

// Rotas públicas (sem autenticação)
routes.post('/register',limiter.authLimiter,  userController.register);
routes.post('/login',limiter.authLimiter, userController.login);
routes.post('/refresh', limiter.refreshLimiter, userController.refresh); 
routes.post('/logout', userController.logout);
routes.post('/forgot-password',limiter.forgotPasswordLimiter, userController.forgotPassword);
routes.post('/reset-password/:token',limiter.forgotPasswordLimiter, userController.resetPassword);

// Middleware de autenticação para as rotas seguintes
routes.use(limiter.generalLimiter);
routes.use(authMiddleware.authenticateToken);

// Rotas protegidas (requerem autenticação)
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);

module.exports = routes;
