// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth');

const authenticate = async (req, res, next) => {
  console.log('[AUTH DEBUG] authenticate middleware started.'); // DEBUG LOG
  const token = req.cookies.token;
  console.log(`[AUTH DEBUG] Token from cookie: ${token ? 'found' : 'not found'}`); // DEBUG LOG

  if (!token) {
    console.log('[AUTH DEBUG] No token found in cookies. Sending 401.'); // DEBUG LOG
    return res.status(401).json({ message: 'Nicht authentifiziert: Kein Token angegeben' });
  }

  let decoded;
  try {
    console.log('[AUTH DEBUG] Verifying token...'); // DEBUG LOG
    decoded = jwt.verify(token, authConfig.JWT_SECRET);
    console.log('[AUTH DEBUG] Token verified successfully. Decoded payload:', decoded); // DEBUG LOG
  } catch (error) {
    console.error('JWT Verifizierungsfehler:', error.message);
    const message = error.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiges Token';
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
    console.log(`[AUTH DEBUG] JWT verification failed: ${message}. Clearing cookie and sending 401.`); // DEBUG LOG
    return res.status(401).json({ message: `Nicht authentifiziert: ${message}` });
  }

  try {
    console.log(`[AUTH DEBUG] Finding player by ID: ${decoded.id}`); // DEBUG LOG
    const player = await db.Player.findByPk(decoded.id, { attributes: ['id', 'username', 'role', 'is_active'] });
    console.log(`[AUTH DEBUG] Player found in DB for ID ${decoded.id}: ${player ? player.username : 'null'}`); // DEBUG LOG

    if (!player || !player.is_active) {
      console.log(`[AUTH DEBUG] Player not found or inactive for ID ${decoded.id}. Clearing cookie and sending 401.`); // DEBUG LOG
      res.clearCookie('token'); // Cookie löschen, wenn User ungültig ist
      return res.status(401).json({ message: 'Nicht authentifiziert: Benutzer nicht gefunden oder inaktiv' });
    }

    console.log(`[AUTH DEBUG] Authentication successful for user ${player.username}. Attaching player to req.`); // DEBUG LOG
    req.player = { id: player.id, username: player.username, role: player.role };
    next();

  } catch (dbError) {
    console.error('Datenbankfehler bei Authentifizierung:', dbError);
    return res.status(500).json({ message: 'Serverfehler bei der Authentifizierung' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.player) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (roles.length > 0 && !roles.includes(req.player.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };