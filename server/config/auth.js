// server/config/auth.js
// Konfiguration für JWT

// WICHTIG: Ersetze 'dein-unsicherer-fallback-dev-secret-key' durch ein starkes,
// zufälliges Secret und verwalte es sicher (z.B. über Umgebungsvariablen in Produktion).
const JWT_SECRET = process.env.JWT_SECRET || 'dein-unsicherer-fallback-dev-secret-key';

// Gültigkeitsdauer des Tokens (z.B. '7d' für 7 Tage, '1h' für 1 Stunde)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN
};