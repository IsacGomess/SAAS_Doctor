require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env para process.env
const express = require('express');
const cors = require('cors'); // Importa o middleware CORS para permitir requisições de diferentes origens
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); // Importa o middleware cookie-parser para lidar com cookies nas requisições

// 1. PRIMEIRO INSTANCIA O APP
const app = express(); 

// 2. CONFIGURAÇÃO DO CORS (DEVE SER O PRIMEIRO MIDDLEWARE ATIVO!)
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], 
    credentials: true 
}));

// 3. INTERPRETADORES DE REQUISIÇÃO (Dados e Cookies)
app.use(express.json()); // Permite que o Express interprete requisições com corpo em JSON
app.use(express.urlencoded({ extended: true })); // Permite que o Express interprete requisições com corpo em URL-encoded
app.use(cookieParser()); // Permite que o Express interprete cookies nas requisições

// 4. LOGGER DE REQUISIÇÕES (Agora ele roda com segurança após o CORS aprovar a chamada)
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl} - Headers:`, {
        origin: req.headers.origin,
        cookie_accessToken: req.cookies?.accessToken ? 'present' : 'missing', 
        authorization: req.headers.authorization ? 'present' : 'missing',
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

app.get('/api/doctor', (req, res) => {
    res.send('API de médicos!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});