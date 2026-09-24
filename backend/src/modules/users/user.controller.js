const jwt = require('jsonwebtoken');
const { ZodError } = require('zod');
const User = require('./user.model.js');
const bcrypt = require('bcrypt');
const { generateCsrfToken } = require('../../middlewares/csrf.js');
const { registerSchema, loginSchema, addMembroSchema, addMembroSchemaWithRegistro, membroIdParamSchema,forgotPasswordSchema,resetPasswordSchema, updateMeSchema} = require('./user.validator.js');
const crypto = require('crypto');
const { Resend } = require('resend');
const BillingService = require('../billing/billing.service.js');
const resend = new Resend(process.env.RESEND_API_KEY);
const PROFESSIONAL_ROLES = ['medico', 'enfermeiro', 'fisioterapeuta', 'nutricionista', 'esteticista', 'dentista', 'nutrologo'];


exports.refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token não fornecido'
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decoded.userId);

        if ( !user || !user.isActive || decoded.tokenVersion !== user.tokenVersion) {
            return res.status(403).json({
            success: false,
            message: 'Sessão inválida ou expirada.'
            });
        }

        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                name: user.name,
                clinicaId: user.clinicaId || null,
                tokenVersion: user.tokenVersion
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Token renovado'
        });

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Refresh token inválido ou expirado'
        });
    }
};
exports.csrfToken = async (req, res, next) => {
    try {
        const token = generateCsrfToken(req, res);

        return res.status(200).json({
            success: true,
            csrfToken: token
        });
    } catch (error) {
        return next(error);
    }
};
exports.logout = async (req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';

    // Tenta identificar o usuário: prefere req.userId (rota protegida), senão tenta decodificar o accessToken
    let userId = req.userId || null;

    if (!userId) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId || null;
            }
        } catch (err) {
            // Não conseguimos obter o userId a partir do token — não falhar o logout, apenas seguir para limpar cookies
            userId = null;
        }
    }

    // Se identificamos o usuário, incrementamos tokenVersion para invalidar sessões antigas
    if (userId) {
        try {
            await User.findByIdAndUpdate(
                userId,
                { $inc: { tokenVersion: 1 } }
            );
        } catch (error) {
            return next(error);
        }
    }

    // Limpa ambos os cookies setando o maxAge para zero (preserva httpOnly/secure/sameSite)
    res.clearCookie('accessToken', { httpOnly: true, secure: isProd, sameSite:'lax' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite:'lax' });

    return res.status(200).json({ success: true, message: 'Deslogado com sucesso' });
};
exports.register = async (req, res) => {
    try {
        const { name, email, password, registroProf } = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já registrado/Email already registered' });
        }

        const newDoctor = await User.create({
            name,
            email,
            password,
            registroProf,
        });

        return res.status(201).json({ success: true, message: 'Registrado com sucesso/registered successfully', name: newDoctor.name });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos enviados para o cadastro/ a senha precisa ter letra Maiuscula, letra minúscula, número e no mínimo 8 caracteres/Invalid data sent for registration',
                errors: error.flatten().fieldErrors
            });
        }

        console.error('erro no terminal => ', error);
        return res.status(500).json({ message: 'Erro ao registrar usuario/Error registering user', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { password, email } = loginSchema.parse(req.body);

        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            console.log('User not found for email:');
            return res.status(400).json({ message: 'Usuário não encontrado ou senha incorreta/User not found or incorrect password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Usuário não encontrado ou senha incorreta/User not found or incorrect password' });
        }

        const accessToken = jwt.sign(
        { userId: user._id, name: user.name, clinicaId: user.clinicaId || null, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id,
                tokenVersion: user.tokenVersion
            },
                process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        const isProd = process.env.NODE_ENV === 'production';

        // 🔒 Configura o Cookie do Access Token
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite:'lax',
            maxAge: 60 * 60 * 1000 // 1 hora
        });

        // 🔒 Configura o Cookie do Refresh Token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite:'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
        });

        // O JSON agora só envia os dados públicos do usuário!
        return res.status(200).json({
            success: true,
            message: 'Login bem-sucedido/Login successful',
            user: { name: user.name, clinicaId: user.clinicaId || null, registroProf: user.registroProf || null, role: user.role }
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos enviados para login',
                errors: error.flatten().fieldErrors
            });
        }

        return res.status(500).json({ message: 'Erro ao fazer login/Error logging in', error: 'Erro no servidor' });
    }
};

exports.addMembro = async (req, res) => {
    console.log('🔵 addMembro chamado');
    console.log('   req.userId:', req.userId);
    console.log('   req.clinicaId:', req.clinicaId);
    console.log('   req.user:', req.user);

    try {
        const { name, email, password, role, registroProf } = addMembroSchemaWithRegistro.parse(req.body);

        if (!req.clinicaId) {
            console.log('❌ Erro: usuário sem clinicaId');
            return res.status(403).json({
                success: false,
                message: 'Usuário sem clínica associada/User has no clinic associated'
            });
        }

        const currentUser = await User.findById(req.userId);
        if (currentUser.role !== 'administrador') {
            console.log('❌ Erro: usuário não é administrador. Role:', currentUser.role);
            return res.status(403).json({
                success: false,
                message: 'Apenas administradores podem adicionar membros/Only administrators can add members'
            });
        }

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
            password,
            role,
            registroProf: registroProf || null,
            clinicaId: req.clinicaId,
            isActive: true
        });

        const seatSummary = await BillingService.getClinicSeatSummary(req.clinicaId);
        const afterAddSummary = {
            ...seatSummary,
            activeProfessionalCount: seatSummary.activeProfessionalCount + (PROFESSIONAL_ROLES.includes(role) ? 1 : 0),
            extraProfessionals: BillingService.calculateExtraProfessionalSeats(seatSummary.activeProfessionalCount + (PROFESSIONAL_ROLES.includes(role) ? 1 : 0))
        };

        let seatSync = null;
        if (PROFESSIONAL_ROLES.includes(role)) {
            try {
                seatSync = await BillingService.reconcileClinicSeatSubscription(req.clinicaId, {
                    activeProfessionalCount: afterAddSummary.activeProfessionalCount
                });
            } catch (syncError) {
                console.error('Erro ao sincronizar assentos extras do Stripe após criação de membro:', syncError);
                return res.status(500).json({
                    success: false,
                    message: syncError.message || 'Configuração de cobrança pendente: STRIPE_PRICE_EXTRA_PROFESSIONAL ausente.'
                });
            }
        }

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
            },
            billing: {
                includedSeats: 5,
                activeProfessionalCount: afterAddSummary.activeProfessionalCount,
                extraProfessionals: afterAddSummary.extraProfessionals,
                monthlyPriceCents: afterAddSummary.extraProfessionals > 0 ? afterAddSummary.extraProfessionals * 4990 : 0,
                billingCycleLabel: afterAddSummary.billingCycleLabel,
                chargeAt: afterAddSummary.chargeAt,
                note: afterAddSummary.extraProfessionals > 0
                    ? `Há ${afterAddSummary.extraProfessionals} profissional(is) adicional(is) acima do limite de 5. O valor será cobrado no ${afterAddSummary.billingCycleLabel}.`
                    : 'Dentro do limite de cinco profissionais incluídos.',
                stripeSync: seatSync
            }
        });
    } catch (error) {
        if (error instanceof ZodError) {
            console.log('❌ Erro de validação:', error.flatten());
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos para cadastro de membro/Invalid member data',
                errors: error.flatten().fieldErrors
            });
        }

        console.error('❌ Erro ao adicionar membro:', error);
        return res.status(500).json({
            message: 'Erro ao cadastrar membro/Error registering member',
            error: 'Erro nos dados digite novamente !'
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
        const membros = await User.find({
        clinicaId: req.clinicaId
})      .select(
            '_id name email registroProf specialty phone role isActive clinicaId createdAt'
)
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: membros.length,
            membros
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao buscar membros/Error fetching members',
            error: 'Erro no servidor'
        });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('_id name registroProf role clinicaId profissao conselhoProfissional conselhoUf numeroRegistroProfissional valorParticularPadrao');
        if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao obter usuário', error: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const parsed = updateMeSchema.parse(req.body);
        if (!req.userId) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

        const updates = {};
        if (Object.prototype.hasOwnProperty.call(parsed, 'registroProf')) updates.registroProf = parsed.registroProf || null;
        if (Object.prototype.hasOwnProperty.call(parsed, 'profissao')) updates.profissao = parsed.profissao || null;
        if (Object.prototype.hasOwnProperty.call(parsed, 'conselhoProfissional')) updates.conselhoProfissional = parsed.conselhoProfissional || null;
        if (Object.prototype.hasOwnProperty.call(parsed, 'conselhoUf')) updates.conselhoUf = parsed.conselhoUf || null;
        if (Object.prototype.hasOwnProperty.call(parsed, 'numeroRegistroProfissional')) updates.numeroRegistroProfissional = parsed.numeroRegistroProfissional || null;
        if (Object.prototype.hasOwnProperty.call(parsed, 'valorParticularPadrao')) updates.valorParticularPadrao = parsed.valorParticularPadrao;

        const updated = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('_id name registroProf role clinicaId profissao conselhoProfissional conselhoUf numeroRegistroProfissional valorParticularPadrao');
        return res.status(200).json({ success: true, user: updated });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos para atualização de perfil',
                errors: error.flatten().fieldErrors
            });
        }
        console.error('Erro updateMe:', error);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar usuário', error: error.message });
    }
};

exports.deleteMembro = async (req, res) => {
    try {
        const { membroId } = membroIdParamSchema.parse(req.params);

        console.log('🔵 deleteMembro chamado');
        console.log('   req.userId:', req.userId);

        if (!req.clinicaId) {
            console.log('❌ Erro: usuário sem clinicaId');
            return res.status(403).json({
                success: false,
                message: 'Usuário sem clínica associada/User has no clinic associated'
            });
        }

        const currentUser = await User.findById(req.userId);
        if (currentUser.role !== 'administrador') {
            console.log('❌ Erro: usuário não é administrador');
            return res.status(403).json({
                success: false,
                message: 'Apenas administradores podem remover membros/Only administrators can remove members'
            });
        }

        const membro = await User.findById(membroId);
        if (!membro) {
            console.log('❌ Erro: membro não encontrado');
            return res.status(404).json({
                success: false,
                message: 'Error interno do servidor/ Internal server error'
            });
        }

        if (membro.clinicaId.toString() !== req.clinicaId.toString()) {
            console.log('❌ Erro: membro não pertence a esta clínica');
            return res.status(403).json({
                success: false,
                message: 'Você não pode remover membros de outras clínicas/You cannot remove members from other clinics'
            });
        }

        if (membroId === req.userId.toString()) {
            console.log('❌ Erro: não pode remover a si mesmo');
            return res.status(403).json({
                success: false,
                message: 'Você não pode remover a si mesmo/You cannot remove yourself'
            });
        }

        const removedRole = membro.role;
        await User.findByIdAndDelete(membroId);
        console.log('✅ Membro removido com sucesso:', membroId);

        let seatSync = null;
        if (PROFESSIONAL_ROLES.includes(removedRole)) {
            try {
                seatSync = await BillingService.reconcileClinicSeatSubscription(req.clinicaId);
            } catch (syncError) {
                console.error('Erro ao sincronizar assentos extras do Stripe após remoção de membro:', syncError);
                return res.status(500).json({
                    success: false,
                    message: syncError.message || 'Configuração de cobrança pendente: STRIPE_PRICE_EXTRA_PROFESSIONAL ausente.'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: ' ✅ Membro removido com sucesso/Member removed successfully',
            billing: seatSync
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido para remoção de membro',
                errors: error.flatten().fieldErrors
            });
        }

        console.error('❌ Erro ao remover membro:', error);
        return res.status(500).json({
            message: 'Erro ao remover membro/Error removing member',
            error: 'Erro no servidor'
        });
    }
};

exports.updateMembro = async (req, res) => {
    try {
        const { membroId } = membroIdParamSchema.parse(req.params);
        const { email, registroProf, name } = req.body;

        if (!req.clinicaId) {
            return res.status(403).json({ success: false, message: 'Usuário sem clínica associada/User has no clinic associated' });
        }

        const currentUser = await User.findById(req.userId);
        if (!currentUser || currentUser.role !== 'administrador') {
            return res.status(403).json({ success: false, message: 'Apenas administradores podem editar membros/Only administrators can edit members' });
        }

        const membro = await User.findById(membroId);
        if (!membro) return res.status(404).json({ success: false, message: 'Membro não encontrado' });

        if (membro.clinicaId.toString() !== req.clinicaId.toString()) {
            return res.status(403).json({ success: false, message: 'Você não pode editar membros de outras clínicas/You cannot edit members from other clinics' });
        }

        // Prevent removing admin role or changing clinicaId via this endpoint
        const updates = {};
        if (typeof email === 'string') updates.email = email;
        if (typeof registroProf === 'string') updates.registroProf = registroProf || null;
        if (typeof name === 'string') updates.name = name;

        const updated = await User.findByIdAndUpdate(membroId, updates, { new: true }).select('_id name email registroProf role clinicaId');

        return res.status(200).json({ success: true, message: 'Membro atualizado com sucesso', membro: updated });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ success: false, message: 'ID inválido', errors: error.flatten().fieldErrors });
        }
        console.error('Erro updateMembro:', error);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar membro', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = resetPasswordSchema.parse(req.body);

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha é obrigatória.'
            });
        }

        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    'Link de recuperação inválido ou expirado.'
            });
        }

        // sem ultilizar hash 
        user.password = password;

        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        // invalida todos os refreshTokens antigos
        user.tokenVersion += 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Senha redefinida com sucesso.'
        });

    } catch (error) {
        console.error('[PASSWORD RESET] Erro:', error);

        return res.status(400).json({
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-mail é obrigatório.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        // Resposta propositalmente genérica
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
            });
        }

        // Token que será enviado ao usuário
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash que será armazenado no MongoDB
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = resetTokenHash;

        user.resetPasswordExpires =
            Date.now() + 15 * 60 * 1000;

        await user.save();

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

         //ENVIA O E-MAIL
        const { error } = await resend.emails.send({
            from: 'Med1PE <no-reply@med1pe.com.br>',
            to: user.email,
            subject: 'Recuperação de senha - Med1PE',
            html: `
                <h2>Recuperação de senha</h2>

                <p>Recebemos uma solicitação para redefinir sua senha.</p>

                <p>
                    <a href="${resetUrl}">
                        Redefinir minha senha
                    </a>
                </p>

                <p>Este link é válido por 15 minutos.</p>

                <p>
                    Se você não solicitou esta alteração,
                    ignore este e-mail.
                </p>
            `
        });
        if (error) {
        console.error('[EMAIL] Erro ao enviar:', error);

        // O e-mail não foi enviado, então invalida o token criado
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.status(200).json({
            success: false,
            message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
        });
    }

        return res.status(200).json({
            success: true,
            message:
                'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
        });

    } catch (error) {
        console.error('[FORGOT PASSWORD] Erro:', error);

        return res.status(400).json({
            success: false,
            message: 'Erro interno do servidor.'
        });
    }
};