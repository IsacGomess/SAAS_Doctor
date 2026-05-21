require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importa o middleware CORS para lidar com requisições de diferentes origens
const mongoose = require('mongoose');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Porta do seu React (Vite)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));// Habilita CORS para permitir requisições de diferentes origens
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições 
app.use(express.urlencoded({ extended: true })); // Habilita o parsing de dados URL-encoded no corpo das requisições
const PORT = process.env.PORT || 3000;
const routeUser = require('./routes/user'); // Importa as rotas do usuário


mongoose.connection.on('error', (err) => console.error('Erro de conexão com o MongoDB:', err)); // Adiciona um listener para erros de conexão com o MongoDB


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));


app.use('/api/users', routeUser); // Usa as rotas do usuário

app.get('/api/doctor', (req, res) => {
    res.send('API de médicos!');

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});