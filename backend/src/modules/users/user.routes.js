const express = require('express');
const routes = require('express').Router();
const userController = require('./user.controller.js');
const authMiddleware = require('../../middlewares/auth.js');
const limiter  = require('../../middlewares/rate-limit.js');

// Rotas públicas (sem autenticação)
routes.post('/register',limiter.authLimiter,  userController.register);
routes.post('/login',limiter.authLimiter, userController.login);
routes.post('/refresh', userController.refresh); 
routes.post('/logout', userController.logout);

// Middleware de autenticação para as rotas seguintes
routes.use(authMiddleware.authenticateToken);
routes.use(limiter.generalLimiter);

// Rotas protegidas (requerem autenticação)
routes.post('/membros', userController.addMembro);
routes.get('/membros', userController.getMembros);
routes.delete('/membros/:membroId', userController.deleteMembro);

module.exports = routes;
