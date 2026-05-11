const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); // Habilita CORS para permitir requisições de diferentes origens
require('dotenv').config();   // Carrega as variáveis de ambiente do arquivo .env
const PORT = process.env.PORT || 3000;
app.use(express.json()); // Middleware para parsear JSON de vir primeiro pq ele traduz o corpo da requisiçao
app.use(express.urlencoded({ extended: true })); // Middleware para parsear dados de formulário
const routeUser = require('./routes/user'); // Importa as rotas do usuário

const mongoose = require('mongoose');

mongoose.connection.on('error', (err) => console.error('Erro de conexão com o MongoDB:', err)); // Adiciona um listener para erros de conexão com o MongoDB


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));


app.use('/api/users', routeUser); // Usa as rotas do usuário com o prefixo /api

app.get('/api/doctor', (req, res) => {
    res.send('API de médicos!');

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});