const crypto = require('crypto');

const SESSION_COOKIE = 'session_token';
const SESSION_EXPIRY_HOURS = 24;

const sessions = {};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(user) {
  const token = generateToken();
  const expiry = Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
  sessions[token] = {
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString(),
    expiresAt: expiry,
  };
  return token;
}

function getSession(token) {
  const session = sessions[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete sessions[token];
    return null;
  }
  return session;
}

function destroySession(token) {
  delete sessions[token];
}

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[SESSION_COOKIE]
    ? req.cookies[SESSION_COOKIE]
    : req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  req.user = session;
  req.sessionToken = token;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies[SESSION_COOKIE]
    ? req.cookies[SESSION_COOKIE]
    : req.headers.authorization;

  if (token) {
    const session = getSession(token);
    if (session) {
      req.user = session;
      req.sessionToken = token;
    }
  }
  next();
}

module.exports = {
  SESSION_COOKIE,
  createSession,
  getSession,
  destroySession,
  requireAuth,
  optionalAuth,
};
