const express = require('express');
const routes = express.Router();
const billingController = require('./billing.controller');
const authMiddleware = require('../../middlewares/auth.js');
const csrfMiddleware = require('../../middlewares/csrf.js');
const limiter = require('../../middlewares/rate-limit.js');

// Protected checkout - create Stripe Checkout Session
routes.post('/checkout', limiter.generalLimiter, authMiddleware.authenticateToken, csrfMiddleware.validateOrigin, csrfMiddleware.doubleCsrfProtection, billingController.checkout);

// Get current subscription for user/clinic context
routes.get('/subscription', limiter.generalLimiter, authMiddleware.authenticateToken, billingController.getSubscription);

// Customer portal
routes.post('/portal', limiter.generalLimiter, authMiddleware.authenticateToken, csrfMiddleware.validateOrigin, csrfMiddleware.doubleCsrfProtection, billingController.portal);

// Webhook endpoint (no auth, raw body). Will be mounted in server.js specially.
routes.post('/webhook', billingController.webhook);

module.exports = routes;
