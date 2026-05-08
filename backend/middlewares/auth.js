const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido/Authentication token not provided' });
    }

    const parts = authHeader.split(' ');
    if(parts.length !== 2){
        return res.status(401).json({ message: 'Token de autenticação inválido/Invalid authentication token' });
    }
    const [scheme,token] = parts;

    if(!/^Bearer$/i.test(scheme)){
        return res.status(401).json({ message: 'Token de autenticação mal formatado/Malformed authentication token' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).json({ message: 'Token de autenticação inválido/Invalid authentication token' });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    });
};