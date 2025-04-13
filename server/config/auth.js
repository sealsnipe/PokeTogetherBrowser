// server/config/auth.js
let dotenvLoaded = false;
try {
  // Versuche, dotenv zu laden, falls vorhanden
  require('dotenv').config();
  dotenvLoaded = true;
  console.log("dotenv geladen aus server/config/auth.js");
} catch (e) {
  // dotenv nicht installiert oder.env nicht gefunden - kein Fehler, wenn Variablen anders gesetzt sind
  console.warn("dotenv-Paket nicht gefunden oder.env-Datei fehlt. Setze auf System-Umgebungsvariablen.");
}

// Lese Werte aus process.env
let jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Sinnvoller Standardwert

// KRITISCH: Überprüfen, ob JWT_SECRET geladen wurde
if (!jwtSecret) {
  console.error("FATALER FEHLER: JWT_SECRET ist nicht in Umgebungsvariablen oder.env-Datei definiert.");
  console.error("Die Authentifizierung kann ohne JWT_SECRET nicht sicher funktionieren.");

  // In Produktion: Prozess beenden ("Fail Fast"-Prinzip)
  if (process.env.NODE_ENV === 'production') {
    console.error("Beende Prozess wegen fehlendem JWT_SECRET in Produktion.");
    process.exit(1); // Sauber beenden
  } else {
    // Im Entwicklungsmodus: Laut warnen und unsicheren Fallback verwenden, um sofortigen Crash zu vermeiden
    console.warn("!!! ENTWICKLUNGSMODUS: Verwende unsicheres Standard-JWT_SECRET. Definiere JWT_SECRET in.env für korrekte Sicherheit!!!");
    // Dieser Fallback darf NIEMALS in Produktion gelangen!
    jwtSecret = 'bitte-sofort-aendern-in-env-oder-config';
  }
} else if (jwtSecret === 'bitte-sofort-aendern-in-env-oder-config' && process.env.NODE_ENV === 'production') {
    // Zusätzliche Prüfung, falls der unsichere Fallback doch in Produktion landet
    console.error("FATALER FEHLER: Unsicheres Entwicklungs-Fallback-JWT_SECRET in Produktionsumgebung erkannt.");
    process.exit(1);
}

// Exportiere die Konfigurationswerte
module.exports = {
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn
};