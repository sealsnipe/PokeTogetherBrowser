# Ausführlicher Plan für Ticket 0003: Auth Controller erstellen

## Ziel
Implementierung des zentralen Authentifizierungs-Controllers (`authController.js`) für die serverseitige Benutzerverwaltung. Der Controller koordiniert die Registrierung, Anmeldung, Abmeldung und das Auslesen des aktuellen Benutzers. Er interagiert mit der Datenbank, prüft und verarbeitet Eingaben, erstellt und prüft JWTs und sorgt für sichere Kommunikation mit dem Client.

---

## 1. Vorbereitung

- **Abhängigkeiten prüfen:**  
  - Ticket 0001: Konfiguration (z.B. JWT-Secret, Ablaufzeiten)
  - Ticket 0002: Player-Modell mit Passwort-Hashing und Instanzmethoden
  - Ticket 0005: Validatoren (optional, aber empfohlen)
- **Datei anlegen:**  
  - `server/controllers/authController.js`

---

## 2. Imports und Grundstruktur

- Notwendige Module importieren:
  - `jsonwebtoken` für JWT-Erstellung
  - Datenbankmodelle (`db`)
  - Auth-Konfiguration
  - `Op` von Sequelize für OR-Abfragen
  - Optional: `express-validator` für Validierung

---

## 3. Funktionen des Controllers

### 3.1. `register(req, res)`
- **Input:** `username`, `email` (optional), `password`
- **Ablauf:**
  1. Eingaben validieren (optional, aber empfohlen)
  2. Prüfen, ob Username oder E-Mail bereits existieren
  3. Neuen Player anlegen (Passwort wird durch Hook gehasht)
  4. Starter-Items und Starter-Pokémon zuweisen (`addStarterItems`)
  5. JWT erstellen und als httpOnly-Cookie setzen
  6. Erfolgsantwort senden
- **Fehlerfälle:**  
  - Benutzer existiert bereits → 400  
  - DB-Fehler → 500  
  - Fehler bei Starter-Items → Fehler loggen, aber Registrierung nicht abbrechen

### 3.2. `login(req, res)`
- **Input:** `username`, `password`
- **Ablauf:**
  1. Eingaben validieren (optional)
  2. Spieler anhand Username suchen
  3. Existenz und Aktivität prüfen
  4. Passwort mit Instanzmethode prüfen
  5. `last_login` aktualisieren
  6. JWT erstellen und als httpOnly-Cookie setzen
  7. Erfolgsantwort senden
- **Fehlerfälle:**  
  - Benutzer nicht gefunden/Passwort falsch → 401  
  - DB-Fehler → 500

### 3.3. `logout(req, res)`
- **Ablauf:**
  1. Token-Cookie löschen (mit gleichen Flags wie beim Setzen)
  2. Erfolgsantwort senden

### 3.4. `getCurrentUser(req, res)`
- **Ablauf:**
  1. Nach Authentifizierung: Daten aus `req.player` zurückgeben

### 3.5. `addStarterItems(playerId)`
- **Ablauf:**
  1. Starter-Items aus DB holen und dem Spieler zuweisen
  2. Zufälliges Starter-Pokémon auswählen und zuweisen
  3. Fehler loggen, aber Registrierung nicht abbrechen

---

## 4. Sicherheit & Best Practices

- **Fehlerbehandlung:**  
  - Klare, aber nicht zu detaillierte Fehlermeldungen an den Client
  - Detaillierte Fehler serverseitig loggen
- **Input-Sanitization:**  
  - Eingaben validieren und bereinigen
- **JWT-Payload:**  
  - Nur notwendige Infos (ID, Username, Rolle)
- **Cookie-Sicherheit:**  
  - `httpOnly`, `secure`, `sameSite: 'Strict'`
- **Rate Limiting:**  
  - Für Login/Registrierung (z.B. mit `express-rate-limit`)
- **Robustheit bei Starter-Items:**  
  - Fehler bei fehlenden Items/Pokémon abfangen

---

## 5. Akzeptanzkriterien

- Datei `server/controllers/authController.js` existiert
- Alle Funktionen (`register`, `login`, `logout`, `getCurrentUser`) sind implementiert und exportiert
- Fehler werden robust behandelt
- Registrierung prüft auf bestehende Benutzer, erstellt neue, hasht Passwort, erstellt JWT, setzt Cookie, ruft `addStarterItems` auf
- Login prüft Benutzer, Passwort, Aktivität, aktualisiert `last_login`, erstellt JWT, setzt Cookie
- Logout löscht Token-Cookie korrekt
- `getCurrentUser` gibt authentifizierte Benutzerdaten zurück
- `addStarterItems` fügt Items und Pokémon hinzu, Fehler werden intern behandelt

---

## 6. Erweiterungen (optional)

- Logging von sicherheitsrelevanten Ereignissen (z.B. fehlgeschlagene Logins)
- Account-Lockout nach X Fehlversuchen
- E-Mail-Bestätigung bei Registrierung (später)