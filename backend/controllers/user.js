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




const addMembroSchema = z.object({
    name: z.string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome não pode passar de 100 caracteres")
        .transform(val => val.trim()),
    email: z.string()
        .email("Formato de e-mail inválido")
        .max(150, "O e-mail é longo demais")
        .transform(val => val.trim().toLowerCase()),
    password: z.string()
        .min(6, "A senha deve ter pelo menos 6 caracteres")
        .max(100, "A senha é longa demais"),
    role: z.enum(['medico', 'enfermeiro', 'recepcionista', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'], {
        errorMap: () => ({ message: 'Cargo inválido. Aceitos: medico, enfermeiro, recepcionista, fisioterapeuta, nutricionista, esteticista, dentista, nutrologo' })
    })
});

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
        const accessToken = jwt.sign(
            { userId: user._id, name: user.name, clinicaId: user.clinicaId || null },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
            { userId: user._id, name: user.name, clinicaId: user.clinicaId || null },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    
        return res.status(200).json({
            success: true,
            message: 'Login bem-sucedido/Login successful',
            accessToken,
            refreshToken,
            user: { name: user.name, clinicaId: user.clinicaId || null }
        });
    } catch (error) {
        
        return res.status(500).json({ message: 'Erro ao fazer login/Error logging in', error: error.message });
    }
};

exports.addMembro = async (req, res) => {
    // Log para debug
    console.log('🔵 addMembro chamado');
    console.log('   req.userId:', req.userId);
    console.log('   req.clinicaId:', req.clinicaId);
    console.log('   req.user:', req.user);
    
    // Verifica se o usuário tem uma clínica associada
    if (!req.clinicaId) {
        console.log('❌ Erro: usuário sem clinicaId');
        return res.status(403).json({
            success: false,
            message: 'Usuário sem clínica associada/User has no clinic associated'
        });
    }

    // Verifica se o usuário é administrador (dono da clínica)
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'administrador') {
        console.log('❌ Erro: usuário não é administrador. Role:', currentUser.role);
        return res.status(403).json({
            success: false,
            message: 'Apenas administradores podem adicionar membros/Only administrators can add members'
        });
    }

    const validation = addMembroSchema.safeParse(req.body);
    if (!validation.success) {
        console.log('❌ Erro de validação:', validation.error.flatten());
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos para cadastro de membro/Invalid member data',
            errors: validation.error.flatten().fieldErrors
        });
    }

    const { name, email, password, role } = validation.data;
    console.log('✅ Dados validados:', { name, email, role, clinicaId: req.clinicaId });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ E-mail já registrado:', email);
            return res.status(400).json({
                success: false,
                message: 'E-mail já registrado/Email already registered'
            });
        }

        const newMembro = await User.create({
            name,
            email,
            password, // será automaticamente criptografado pelo middleware pre-save
            role,
            clinicaId: req.clinicaId, // Injeta automaticamente a clínica do dono
            isActive: true
        });

        console.log('✅ Membro criado:', newMembro._id, 'com clinicaId:', newMembro.clinicaId);

        return res.status(201).json({
            success: true,
            message: 'Membro cadastrado com sucesso/Member registered successfully',
            membro: {
                _id: newMembro._id,
                name: newMembro.name,
                email: newMembro.email,
                role: newMembro.role,
                clinicaId: newMembro.clinicaId
            }
        });
    } catch (error) {
        console.error('❌ Erro ao adicionar membro:', error);
        return res.status(500).json({
            message: 'Erro ao cadastrar membro/Error registering member',
            error: error.message
        });
    }
};

exports.getMembros = async (req, res) => {
    if (!req.clinicaId) {
        return res.status(200).json({
            success: true,
            count: 0,
            membros: []
        });
    }

    try {
        const membros = await User.find({ clinicaId: req.clinicaId })
            .select('-password') // Nunca retorna a senha
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: membros.length,
            membros
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao buscar membros/Error fetching members',
            error: error.message
        });
    }
};

exports.deleteMembro = async (req, res) => {
    const { membroId } = req.params;

    console.log('🔵 deleteMembro chamado');
    console.log('   req.userId:', req.userId);
    console.log('   req.clinicaId:', req.clinicaId);
    console.log('   membroId:', membroId);

    if (!req.clinicaId) {
        console.log('❌ Erro: usuário sem clinicaId');
        return res.status(403).json({
            success: false,
            message: 'Usuário sem clínica associada/User has no clinic associated'
        });
    }

    // Verifica se o usuário é administrador
    const currentUser = await User.findById(req.userId);
    if (currentUser.role !== 'administrador') {
        console.log('❌ Erro: usuário não é administrador');
        return res.status(403).json({
            success: false,
            message: 'Apenas administradores podem remover membros/Only administrators can remove members'
        });
    }

    try {
        // Verifica se o membro existe e pertence à mesma clínica
        const membro = await User.findById(membroId);
        if (!membro) {
            console.log('❌ Erro: membro não encontrado');
            return res.status(404).json({
                success: false,
                message: 'Membro não encontrado/Member not found'
            });
        }

        if (membro.clinicaId.toString() !== req.clinicaId.toString()) {
            console.log('❌ Erro: membro não pertence a esta clínica');
            return res.status(403).json({
                success: false,
                message: 'Você não pode remover membros de outras clínicas/You cannot remove members from other clinics'
            });
        }

        // Impede que o administrador remova a si mesmo
        if (membroId === req.userId.toString()) {
            console.log('❌ Erro: não pode remover a si mesmo');
            return res.status(403).json({
                success: false,
                message: 'Você não pode remover a si mesmo/You cannot remove yourself'
            });
        }

        await User.findByIdAndDelete(membroId);
        console.log('✅ Membro removido com sucesso:', membroId);

        return res.status(200).json({
            success: true,
            message: 'Membro removido com sucesso/Member removed successfully'
        });
    } catch (error) {
        console.error('❌ Erro ao remover membro:', error);
        return res.status(500).json({
            message: 'Erro ao remover membro/Error removing member',
            error: error.message
        });
    }
};



