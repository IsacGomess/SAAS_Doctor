const rateLimit = require('express-rate-limit');

// Configuração padrão para rotas comuns
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 500, // Limita cada IP a 500 requisições por janela
  message: 'Muitas requisições vindas deste IP, tente novamente após 15 minutos.',
  standardHeaders: true, // Retorna info de limite nos headers Ratelimit-*
  legacyHeaders: false, 
});

// Configuração RÍGIDA para Login e Registro
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Janela de 1 hora
  max: 20, // Apenas 20 tentativas de login por hora por IP
  message: 'Muitas tentativas de login. Por segurança, tente novamente daqui a uma hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

exports.generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,

    handler: (req, res) => {
        console.log("Rate limit atingido:", req.ip, req.originalUrl);

        res.status(429).json({
            message: "Rate limit atingido"
        });
    }
});