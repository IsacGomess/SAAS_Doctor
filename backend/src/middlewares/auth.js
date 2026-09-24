const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model.js');

exports.authenticateToken = async (req, res, next) => {
    let token = null;

    // 1. Tenta pegar o accessToken pelo cookie
    if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    // 2. Fallback: Authorization Bearer
    else if (req.headers.authorization) {
        const [scheme, credentials] =
            req.headers.authorization.split(' ');

        if (
            /^Bearer$/i.test(scheme) &&
            credentials
        ) {
            token = credentials;
        }
    }

    // 3. Nenhum token encontrado
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Autenticação necessária.'
        });
    }

    // 4. Verifica assinatura e expiração do JWT
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        // JWT inválido/expirado: retornar 401
        return res.status(401).json({
            success: false,
            message: 'Sessão inválida ou expirada.'
        });
    }

    // 5. Busca o estado ATUAL do usuário no banco
    let user;
    try {
        user = await User.findById(decoded.userId)
            .select('_id name clinicaId role registroProf isActive tokenVersion');
    } catch (error) {
        // Erro inesperado de banco: encaminhar para o error handler global
        return next(error);
    }

    // Usuário removido ou desativado
    if (!user || !user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Sessão inválida ou expirada.'
        });
    }

    // 6. Verifica se a sessão ainda é válida
    if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({
            success: false,
            message: 'Sessão inválida ou expirada.'
        });
    }

    req.userId = user._id;
    req.clinicaId = user.clinicaId || null;

    req.user = {
        userId: user._id,
        name: user.name,
        clinicaId: user.clinicaId || null,
        role: user.role,
        registroProf: user.registroProf || null
    };

    next();
};