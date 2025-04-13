# Ticket 0004: Auth Middleware erstellen

**Einleitung:**

Middleware in Express sind Funktionen, die wie "Kontrollpunkte" zwischen einer eingehenden Anfrage und der endgültigen Bearbeitung durch den Routen-Handler (Controller) geschaltet werden. Sie können Anfragen prüfen, modifizieren oder abbrechen. Dieses Ticket erstellt zwei solcher Middleware-Funktionen speziell für die Authentifizierung (Wer bist du?) und Autorisierung (Was darfst du?).

*   **Zweck der `authenticate`-Middleware:**
    *   **Funktion:** Dient als primärer Sicherheitscheck für alle API-Routen, die einen eingeloggten Benutzer erfordern.
    *   **Ablauf:**
        1.  Liest das `token`-Cookie aus der eingehenden Anfrage (`req.cookies.token`). Dies funktioniert nur, wenn `cookie-parser` vorher eingebunden wurde (siehe Ticket 0007).
        2.  **Fehlendes Token:** Wenn kein Cookie namens `token` gefunden wird, bedeutet das, dass der Benutzer nicht eingeloggt ist (oder sein Cookie verloren hat). Die Anfrage wird sofort mit Status 401 (Unauthorized) abgelehnt.
        3.  **Token-Verifizierung:** Wenn ein Token vorhanden ist, wird `jwt.verify()` aufgerufen. Diese Funktion prüft zwei Dinge:
            *   **Signatur:** Ist das Token mit unserem geheimen Schlüssel (`JWT_SECRET`) signiert? Wenn nicht, wurde es manipuliert oder ist von einer anderen Quelle -> Ungültig.
            *   **Ablaufdatum:** Ist das im Token gespeicherte Ablaufdatum (`exp`-Claim) bereits überschritten? -> Abgelaufen.
            Bei Fehlern (ungültig/abgelaufen) wird die Anfrage ebenfalls mit Status 401 abgelehnt.
        4.  **Benutzerprüfung:** Wenn das Token gültig ist, enthält der dekodierte Payload (`decoded`) die Benutzer-ID (und andere Daten, die wir beim Erstellen hineingelegt haben, wie `username` und `role`). Mit der ID wird in der Datenbank nach dem entsprechenden Spieler gesucht.
        5.  **Existenz/Aktivitätsprüfung:** Es wird geprüft, ob der Benutzer in der Datenbank überhaupt (noch) existiert und ob sein `is_active`-Flag auf `true` steht. Dies verhindert den Zugriff für gelöschte oder deaktivierte Benutzer, selbst wenn sie noch ein gültiges Token haben. Bei Fehlern -> Status 401.
        6.  **Anfrage anreichern:** Wenn alle Prüfungen erfolgreich waren, werden die relevanten Benutzerdaten (ID, Username, Rolle) an das `req`-Objekt angehängt (`req.player = ...`).
        7.  **Weitergabe:** `next()` wird aufgerufen, um die Anfrage an die nächste Middleware oder den eigentlichen Routen-Handler weiterzugeben, der nun auf `req.player` zugreifen kann.
*   **Zweck der `authorize`-Middleware (Optional):**
    *   **Funktion:** Ermöglicht rollenbasierten Zugriffsschutz für bestimmte Routen, nachdem der Benutzer bereits authentifiziert wurde.
    *   **Ablauf:**
        1.  Diese Funktion ist eine "Factory", d.h., sie wird mit einer Liste erlaubter Rollen aufgerufen (z.B. `authorize(['admin', 'moderator'])`) und *gibt* die eigentliche Middleware-Funktion zurück.
        2.  Die zurückgegebene Middleware wird *nach* `authenticate` in einer Route platziert.
        3.  Sie prüft zuerst, ob `req.player` (von `authenticate` gesetzt) überhaupt vorhanden ist. Wenn nicht -> Status 401.
        4.  Dann prüft sie, ob die Rolle in `req.player.role` in der Liste der erlaubten Rollen enthalten ist.
        5.  Wenn die Rolle nicht erlaubt ist, wird die Anfrage mit Status 403 (Forbidden) abgelehnt.
        6.  Wenn die Rolle erlaubt ist, wird `next()` aufgerufen.

Diese Middleware-Funktionen sind entscheidend, um API-Endpunkte abzusichern und sicherzustellen, dass nur authentifizierte (und ggf. autorisierte) Benutzer darauf zugreifen können.

---

**Ziel:** Erstellen der Express-Middleware zur Überprüfung der JWT-Authentifizierung und optional zur Autorisierung basierend auf Benutzerrollen.

**Abhängigkeiten:** Ticket 0001 (Config), Ticket 0002 (Player Model)

**Aufgaben:**

1.  **Datei erstellen:** `server/middleware/authMiddleware.js`.
2.  **Imports hinzufügen:**
    ```javascript
    const jwt = require('jsonwebtoken');
    const db = require('../models'); // Pfad ggf. anpassen
    const authConfig = require('../config/auth'); // Pfad ggf. anpassen
    ```
3.  **`authenticate(req, res, next)` Funktion implementieren:**
    *   Muss `async` sein, da wir auf die Datenbank zugreifen.
    ```javascript
    const authenticate = async (req, res, next) => {
      const token = req.cookies.token; // Extrahiere Token aus Cookie

      if (!token) {
        // Kein Token -> Nicht eingeloggt
        return res.status(401).json({ message: 'Nicht authentifiziert: Kein Token angegeben' });
      }

      let decoded;
      try {
        // Verifiziere Signatur und Ablaufdatum
        decoded = jwt.verify(token, authConfig.JWT_SECRET);
      } catch (error) {
        // Token ungültig oder abgelaufen
        console.error('JWT Verifizierungsfehler:', error.message);
        const message = error.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiges Token';
        // Optional: Cookie löschen, wenn Token ungültig/abgelaufen ist
        res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
        return res.status(401).json({ message: `Nicht authentifiziert: ${message}` });
      }

      // Token ist gültig, prüfe Benutzer in DB
      try {
        const player = await db.Player.findByPk(decoded.id, {
          // Lade nur notwendige Felder für die Autorisierung und Identifikation
          attributes: ['id', 'username', 'role', 'is_active']
        });

        if (!player || !player.is_active) {
          // Benutzer existiert nicht (mehr) oder ist deaktiviert
          res.clearCookie('token'); // Vorsorglich Cookie löschen
          return res.status(401).json({ message: 'Nicht authentifiziert: Benutzer nicht gefunden oder inaktiv' });
        }

        // Hänge die relevanten Spielerdaten an das `req`-Objekt an
        // Dies macht die Benutzerinfos in nachfolgenden Handlern verfügbar
        req.player = { id: player.id, username: player.username, role: player.role };

        // Alles ok, gehe zur nächsten Middleware/Route
        next();

      } catch (dbError) {
        // Fehler bei der Datenbankabfrage
        console.error('Datenbankfehler bei Authentifizierung:', dbError);
        return res.status(500).json({ message: 'Serverfehler bei der Authentifizierung' });
      }
    };
    ```
4.  **`authorize(roles = [])` Funktion implementieren (Optional):**
    ```javascript
    const authorize = (roles = []) => {
      // Konvertiere einzelne Rolle zu Array
      if (typeof roles === 'string') {
        roles = [roles];
      }

      // Gebe die eigentliche Middleware-Funktion zurück
      return (req, res, next) => {
        // WICHTIG: Diese Middleware muss NACH 'authenticate' ausgeführt werden!
        if (!req.player) {
          // Sollte nicht passieren, wenn 'authenticate' vorher lief, aber sicher ist sicher
          return res.status(401).json({ message: 'Nicht authentifiziert' });
        }

        // Prüfe, ob die Rolle des Spielers in der erlaubten Liste ist
        // Wenn 'roles' leer ist, wird jeder authentifizierte Benutzer durchgelassen
        if (roles.length > 0 && !roles.includes(req.player.role)) {
          // Benutzer hat nicht die erforderliche Rolle
          return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
        }

        // Benutzer ist autorisiert
        next();
      };
    };
    ```
5.  **Exportieren:** Exportiere die erstellten Funktionen: `module.exports = { authenticate, authorize };`.

**Best Practices & Überlegungen:**

*   **Reihenfolge:** `authenticate` muss in den Routen *vor* `authorize` verwendet werden.
*   **Fehlermeldungen:** Gib klare, aber sichere Fehlermeldungen zurück. Logge detaillierte Fehler serverseitig.
*   **Cookie löschen:** Es ist sinnvoll, das Cookie zu löschen (`res.clearCookie`), wenn das Token ungültig/abgelaufen ist oder der Benutzer nicht gefunden/inaktiv ist, um zu verhindern, dass der Client es weiterhin sendet.
*   **Effizienz:** Lade in `authenticate` nur die wirklich benötigten Felder aus der Datenbank (`attributes: [...]`).

**Mögliche Probleme & Risiken:**

*   **Falsche Reihenfolge:** Wenn `authorize` vor `authenticate` verwendet wird, fehlt `req.player`, was zu Fehlern führt.
*   **JWT Verifizierungsfehler:** Probleme mit dem Secret oder manipulierte Tokens führen zu 401-Fehlern.
*   **Datenbankausfall:** Wenn die DB während der Benutzerprüfung nicht erreichbar ist, führt dies zu 500-Fehlern.

**Akzeptanzkriterien:**

*   Die Datei `server/middleware/authMiddleware.js` existiert.
*   Die `authenticate`-Middleware extrahiert und validiert das JWT aus dem Cookie, lädt den Benutzer, prüft dessen Aktivität, hängt `req.player` an und ruft `next()` auf oder sendet einen 401-Status bei Fehlern. Sie löscht ggf. ungültige Cookies.
*   Die `authorize`-Middleware (falls implementiert) prüft korrekt die Benutzerrolle gegen die übergebenen Rollen und sendet einen 403-Status bei fehlender Berechtigung. Sie funktioniert nur korrekt, wenn sie nach `authenticate` verwendet wird.
*   Die Middleware behandelt Fehler korrekt und gibt aussagekräftige Fehlermeldungen zurück.