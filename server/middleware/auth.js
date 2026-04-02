const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

const COOKIE_NAME = 'bp_token';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function attachUser(req, res, next) {
  const header = req.headers.authorization;
  let token =
    req.cookies && req.cookies[COOKIE_NAME]
      ? req.cookies[COOKIE_NAME]
      : null;
  if (!token && header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  }
  const decoded = verifyToken(token);
  req.user = decoded
    ? { id: decoded.sub, email: decoded.email, name: decoded.name, role: decoded.role }
    : null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function setAuthCookie(res, user) {
  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

module.exports = {
  attachUser,
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
  COOKIE_NAME,
};
