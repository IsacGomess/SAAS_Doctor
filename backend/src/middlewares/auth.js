const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
    let token = null;

    // 1. TENTA PEGAR O TOKEN DO COOKIE PRIMEIRO (Fluxo Novo e Seguro)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } 
    // 2. PLANO B: Se não estiver no cookie, tenta ler do Header Authorization antigo
    else if (req.headers.authorization) {
        const authHeader = req.headers.authorization;
        const parts = authHeader.split(' ');
        
        if (parts.length === 2) {
            const [scheme, credentials] = parts;
            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        }
    }

    // 3. SE NÃO ACHOU O TOKEN EM LUGAR NENHUM, BARRA A REQUISIÇÃO
    if (!token) {
        console.warn('[AUTH] Token de autenticação ausente para:', req.originalUrl);
        return res.status(401).json({ 
            message: 'Token de autenticação não fornecido/Authentication token not provided' 
        });
    }

    // 4. VALIDAÇÃO DO JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.warn('[AUTH] Falha na verificação do JWT:', err.message);
            return res.status(401).json({ 
                message: 'Token de autenticação inválido ou expirado/Invalid or expired authentication token' 
            });
        }
        
        // Mantém exatamente as mesmas propriedades para não quebrar nenhum controller do seu app!
        req.userId = decoded.userId;
        req.clinicaId = decoded.clinicaId || null;
        req.user = decoded;
        
        next(); // Libera o acesso para buscar os pacientes, filas, etc.!
    });
};