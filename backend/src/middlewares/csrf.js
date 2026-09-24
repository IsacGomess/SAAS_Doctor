const { doubleCsrf } = require('csrf-csrf');

const isProd = process.env.NODE_ENV === 'production';

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: 'csrfToken',
  cookieOptions: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  },
  // token enviado explicitamente pelo frontend no header X-CSRF-Token
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  // usa o refreshToken como identificador de sessão
  getSessionIdentifier: (req) => req.cookies?.refreshToken || 'anonymous',
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
});

module.exports = {
  generateCsrfToken,
  doubleCsrfProtection,
  validateOrigin: (req, res, next) => {
    const method = (req.method || '').toUpperCase();
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!mutating) return next();

    const origin = req.headers.origin;
    const expected = process.env.FRONTEND_URL;

    if (!origin || origin !== expected) {
      return res.status(403).json({ success: false, message: 'Origem da requisição inválida.' });
    }

    return next();
  }
};
