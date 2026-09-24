require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env para process.env
const express = require('express');
const helmet = require('helmet'); // Importa o middleware Helmet para segurança HTTP
const cors = require('cors'); // Importa o middleware CORS para permitir requisições de diferentes origens
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); // Importa o middleware cookie-parser para lidar com cookies nas requisições
const limiter  = require('./middlewares/rate-limit.js');


// 1. PRIMEIRO INSTANCIA O APP
const app = express(); 

app.set('trust proxy', 1); // Configura o Express para confiar no proxy reverso (útil se estiver atrás de um proxy ou load balancer)
app.use(helmet()) // Adiciona o middleware Helmet para segurança HTTP (protege contra algumas vulnerabilidades conhecidas)
// 2. CONFIGURAÇÃO DO CORS
app.use(cors({
    origin: process.env.FRONTEND_URL, // Permite requisições apenas do frontend especificado no arquivo .env
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'], 
    credentials: true 
}));

// 3. INTERPRETADORES DE REQUISIÇÃO (Dados e Cookies)
app.use(cookieParser()); // Permite que o Express interprete cookies nas requisições

// 4. LOGGER DE REQUISIÇÕES (Agora ele roda com segurança após o CORS aprovar a chamada)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`, {
      origin: req.headers.origin,
      hasAccessToken: Boolean(req.cookies?.accessToken),
      contentType: req.headers['content-type']
    });

    next();
  });
}

// IMPORTAR ROTAS DOS MÓDULOS
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const convenioRoutes = require('./modules/convenios/convenio.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');
const appointmentRoutes = require('./modules/appointments/appointment.routes.js');
const reportsRoutes = require('./modules/reports/report.routes.js');
const billingRoutes = require('./modules/billing/billing.routes.js');
const billingController = require('./modules/billing/billing.controller.js');
const PORT = process.env.PORT || 3000;

mongoose.connection.on('error', (err) => console.error('Erro de conexão com o MongoDB:', err)); // Adiciona um listener para erros de conexão do MongoDB

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Conectado ao MongoDB');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}


// ✅ USAR AS ROTAS DOS MÓDULOS (Continuam intocadas e protegidas!)
// Webhook endpoint must receive raw body before express.json middleware
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

// Now parse JSON for the rest of the app
app.use(express.json({ limit: '1mb' }));

app.use('/api', limiter.generalLimiter); // Aplica o limitador de taxa geral a todas as rotas da API
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/convenios', convenioRoutes);
app.use('/api/waiting-line', waitingLineRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/billing', billingRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

// Error handler: primeiro tratamos erros CSRF explicitamente
app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    console.error('[CSRF ERROR]', { method: req.method, path: req.originalUrl });
    return res.status(403).json({ success: false, message: 'Requisição CSRF inválida.' });
  }

  console.error('[ERROR]', {
    method: req.method,
    path: req.originalUrl,
    message: err?.message
  });

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});
startServer();