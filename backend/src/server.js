require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env para process.env
const express = require('express');
const helmet = require('helmet'); // Importa o middleware Helmet para segurança HTTP
const cors = require('cors'); // Importa o middleware CORS para permitir requisições de diferentes origens
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); // Importa o middleware cookie-parser para lidar com cookies nas requisições

// 1. PRIMEIRO INSTANCIA O APP
const app = express(); 

app.set('trust proxy', 1); // Configura o Express para confiar no proxy reverso (útil se estiver atrás de um proxy ou load balancer)
app.use(helmet()) // Adiciona o middleware Helmet para segurança HTTP (protege contra algumas vulnerabilidades conhecidas)

// 3. Limite do JSON proteje contra ataques a grandes volumes de processamento de dados e faz o jsom ser lido 
app.use(express.json({
    limit: '1mb'
}));
// 2. CONFIGURAÇÃO DO CORS (DEVE SER O PRIMEIRO MIDDLEWARE ATIVO!)
app.use(cors({
    origin: process.env.FRONTEND_URL, // Permite requisições apenas do frontend especificado no arquivo .env
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Cookie'], 
    credentials: true 
}));

// 3. INTERPRETADORES DE REQUISIÇÃO (Dados e Cookies)
app.use(cookieParser()); // Permite que o Express interprete cookies nas requisições

// 4. LOGGER DE REQUISIÇÕES (Agora ele roda com segurança após o CORS aprovar a chamada)
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl} - Headers:`, {
        origin: req.headers.origin,
        cookie_accessToken: req.cookies?.accessToken ? 'present' : 'missing', 
        'content-type': req.headers['content-type']
    });
    next();
});

// IMPORTAR ROTAS DOS MÓDULOS
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const convenioRoutes = require('./modules/convenios/convenio.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');
const appointmentRoutes = require('./modules/appointments/appointment.routes.js');
const reportsRoutes = require('./modules/reports/report.routes.js');
const PORT = process.env.PORT || 3000;

mongoose.connection.on('error', (err) => console.error('Erro de conexão com o MongoDB:', err)); // Adiciona um listener para erros de conexão do MongoDB

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// ✅ USAR AS ROTAS DOS MÓDULOS (Continuam intocadas e protegidas!)
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/convenios', convenioRoutes);
app.use('/api/waiting-line', waitingLineRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportsRoutes);
app.get('/api/doctor', (req, res) => {
    res.send('API de médicos!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});