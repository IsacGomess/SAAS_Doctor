const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization; // Espera o token no formato "Bearer

    if(!authHeader) {
        console.warn('[AUTH] Authorization header missing for', req.originalUrl);
        return res.status(401).json({ message: 'Token de autenticação não fornecido/Authentication token not provided' });
    }

    const parts = authHeader.split(' '); // Divide o header em partes, esperando "Bearer" e o token
    if(parts.length !== 2){
        console.warn('[AUTH] Authorization header malformed (parts !== 2)', authHeader);
        return res.status(401).json({ message: 'Token de autenticação inválido/Invalid authentication token' });
    }
    const [scheme,token] = parts;

    if(!/^Bearer$/i.test(scheme)){
        console.warn('[AUTH] Authorization scheme not Bearer:', scheme);
        return res.status(401).json({ message: 'Token de autenticação mal formatado/Malformed authentication token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            console.warn('[AUTH] JWT verification failed:', err && err.message);
            return res.status(401).json({ message: 'Token de autenticação inválido/Invalid authentication token' });
        }
        req.userId = decoded.userId;
        req.clinicaId = decoded.clinicaId || null;
        req.user = decoded;
        next();
    });
};