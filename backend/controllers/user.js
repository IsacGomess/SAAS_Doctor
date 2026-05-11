const jwt = require('jsonwebtoken');
require('../models/User');
const bcrypt = require('bcrypt');

// Importando o modelo User
exports.register = async (req, res) => {
    try {
        const { name, email, password, crm } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já registrado/Email already registered' });
        }
        // Gerar o hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDoctor = await User.create({ 
            name,
            email,
            password: hashedPassword,
            crm,
        });
        return res.status(201).json({ success: true, message: 'Médico registrado com sucesso/Doctor registered successfully', doctor: newDoctor });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao registrar médico/Error registering doctor', error: error.message });
    }
};



// Function to generate access and refresh tokens
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado/User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta/Incorrect password' });
        }
        // Gerar tokens JWT para autenticação do usuário e autorização de acesso a rotas protegidas
        const acessToken = jwt.sign({ userId: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user._id}, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        return res.status(200).json({ success: true, message: 'Login bem-sucedido/Login successful', acessToken, refreshToken, user: { name: user.name}  });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao fazer login/Error logging in', error: error.message });
    }
};



