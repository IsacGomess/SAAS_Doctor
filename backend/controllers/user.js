const jwt = require('jsonwebtoken');
const {z }= require('zod');
const  { User }   = require('../models');
const bcrypt = require('bcrypt');

const userSchema = z.object({
    name: z.string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome não pode passar de 100 caracteres")
        .transform(val => val.trim()), // Mantém maiúsculas/minúsculas originais, mas limpa espaços inúteis
    
    email: z.string()
        .email("Formato de e-mail inválido")
        .max(150, "O e-mail é longo demais")
        .transform(val => val.trim().toLowerCase()), // ✨ E-mail sempre minúsculo para evitar duplicidade de "Email@Cc.com" e "email@cc.com"
    
    password: z.string()
        .min(6, "A senha deve ter pelo menos 6 caracteres")
        .max(100, "A senha é longa demais"),
    
    crm: z.string()
        .min(4, "CRM inválido")
        .max(15, "CRM longo demais")
        .transform(val => val.trim().toUpperCase()) // ✨ Garante que a UF do CRM fique sempre em maiúsculo (ex: "123456-SP")
});
// Importando o modelo User
exports.register = async (req, res) => {

    const validation = userSchema.safeParse(req.body);
    console.log(validation.data)
    if(!validation.success){
        console.log("------- ERRO DE VALIDAÇÃO DO ZOD -------");
        console.log(validation.error.flatten().fieldErrors);
        console.log("----------------------------------------");
        return res.status(400).json({
            success:false,
            message: 'Dados invalidos enviados para o cadastro',
            errors: validation.error.flatten().fieldErrors
        });
    }

    const { name, email, password, crm } = validation.data;

    try {
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já registrado/Email already registered' });
        }
        const newDoctor = await User.create({ 
            name,
            email,
            password,
            crm,
        });
        return res.status(201).json({ success: true, message: 'Médico registrado com sucesso/Doctor registered successfully', name: newDoctor.name});
    } catch (error) {
        console.error("erro no terminal => ",error)
        return res.status(500).json({ message: 'Erro ao registrar médico/Error registering doctor', error: error.message });
    }
};




const loginSchema = z.object({
    email: z.string()
        .email("Formato de e-mail inválido")
        .transform(val => val.trim().toLowerCase()), // Garante que busca o e-mail em minúsculo
    password: z.string().min(6, "A senha é obrigatória")
});
// Function to generate access and refresh tokens
exports.login = async (req, res) => {
    
    const validation = loginSchema.safeParse(req.body);

    if(!validation.success){
        console.log('senha incorreta')
        return res.status(400).json({
            success:false,
            message: 'Dados invalidos enviados para o cadastro',
            errors: validation.error.flatten().fieldErrors
        });
    }

    const {password, email} = validation.data;

    try {

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:'); // Log para depuração
            return res.status(400).json({ message: 'Usuário não encontrado/User not found' });
        }
        console.log('User found: comparando a senha '); // Log para depuração
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta/Incorrect password' });
        }
        // Gerar tokens JWT para autenticação do usuário e autorização de acesso a rotas protegidas
        const accessToken = jwt.sign({ userId: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user._id}, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
        return res.status(200).json({ success: true, message: 'Login bem-sucedido/Login successful', accessToken, refreshToken, user: { name: user.name}  });
    } catch (error) {
        
        return res.status(500).json({ message: 'Erro ao fazer login/Error logging in', error: error.message });
    }
};



