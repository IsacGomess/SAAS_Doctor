require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORTAR ROTAS DOS MÓDULOS
const userRoutes = require('./modules/users/user.routes.js');
const patientRoutes = require('./modules/patients/patient.routes.js');
const clinicRoutes = require('./modules/clinics/clinic.routes.js');
const convenioRoutes = require('./modules/convenios/convenio.routes.js');
const waitingLineRoutes = require('./modules/waiting-line/waiting-line.routes.js');
const appointmentRoutes = require('./modules/appointments/appointment.routes.js');

const app = express();

// Simple request logger to aid debugging
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl} - Headers:`, {
        origin: req.headers.origin,
        authorization: req.headers.authorization ? 'present' : 'missing',
        'content-type': req.headers['content-type']
    });
    next();
});

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

mongoose.connection.on('error', (err) => console.error('Erro de conexão com o MongoDB:', err));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// ✅ USAR AS ROTAS DOS MÓDULOS
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