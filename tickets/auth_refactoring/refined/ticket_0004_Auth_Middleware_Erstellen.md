# Ticket 0004 (Refined): Auth Middleware erstellen

## 1. Einleitung und Zielsetzung

**Kontext:**  
Das Projekt PokeTogetherBrowser zielt darauf ab, ein webbasiertes Multiplayer-Spiel im Pokémon-Stil zu entwickeln. Ein zentrales Merkmal ist die Persistenz von Spielerdaten wie Position, Inventar und Pokémon. Um dies sicherzustellen und den Fortschritt der Spieler zu schützen, ist eine robuste Authentifizierung unerlässlich.

**Problemstellung:**  
Die Analyse des aktuellen Projektstands hat eine signifikante Diskrepanz zwischen der Dokumentation und dem implementierten Code aufgedeckt. Während die Dokumentation ein modernes Authentifizierungssystem basierend auf JSON Web Tokens (JWT) und Cookies beschreibt, verwendet der aktuelle Code ein einfaches, speicherbasiertes Session-System. Diese Abweichung stellt nicht nur ein potenzielles Sicherheitsrisiko dar, sondern behindert auch die Implementierung weiterer geplanter Features, die auf einer sicheren und zustandslosen Authentifizierung aufbauen. Die Behebung dieser Diskrepanz ist daher von grundlegender Bedeutung für die weitere Entwicklung und die Stabilität des Projekts.

**Ziel des Tickets:**  
Das primäre Ziel von Ticket 0004 ist die Erstellung von zwei zentralen Express-Middleware-Funktionen:
- **authenticate:** Überprüft, ob ein Benutzer authentifiziert ist, indem sie ein JWT aus einem Cookie validiert.
- **authorize:** Optionale Middleware für rollenbasierte Zugriffskontrolle (RBAC).

**Bedeutung der Middleware:**  
Middleware ist in Express ein etabliertes Muster, um Anfragen zu verarbeiten, bevor sie den eigentlichen Routen-Handler erreichen. Für Authentifizierung und Autorisierung bietet dieser Ansatz erhebliche Vorteile: Die Logik wird zentral an einer Stelle implementiert und kann dann wiederverwendbar auf beliebig viele Routen angewendet werden. Dies vermeidet Code-Duplizierung in den einzelnen Controllern und stellt eine konsistente Sicherheitsprüfung über die gesamte API hinweg sicher.

---

## 2. Grundlagen: Express Middleware und JWT-Authentifizierung

**Express Middleware:**  
Middleware-Funktionen in Express sind Funktionen, die Zugriff auf das Request-Objekt (req), das Response-Objekt (res) und die nächste Middleware-Funktion in der Kette (next) haben. Sie agieren als "Kontrollpunkte" im Lebenszyklus einer Anfrage. Die Funktion next() gibt die Kontrolle an die nächste Funktion weiter. Die Reihenfolge der Registrierung ist kritisch.

**JSON Web Tokens (JWT):**  
JWTs sind ein kompakter und standardisierter Weg, um Informationen sicher zwischen Parteien als JSON-Objekt zu übertragen. Sie bestehen aus Header, Payload und Signatur. Die Verifizierung erfolgt serverseitig mittels jwt.verify(token, JWT_SECRET). Die Sicherheit hängt entscheidend von der Geheimhaltung des JWT_SECRET ab.

**HTTP-only Cookies:**  
JWTs werden sicher im HttpOnly-Cookie gespeichert. Zusätzliche Attribute wie Secure und SameSite erhöhen die Sicherheit. Für den Zugriff auf Cookies wird cookie-parser benötigt.

---

## 3. Implementierungsplan: authenticate-Middleware

**Dateistruktur:**  
Die Middleware wird in einer neuen Datei implementiert: `server/middleware/authMiddleware.js`.

**Notwendige Imports:**
```js
const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth');
```

**Funktionsdefinition:**  
Die Middleware wird asynchron definiert:
```js
const authenticate = async (req, res, next) => { ... }
```

**Schritt-für-Schritt Implementierung:**
1. **Token-Extraktion:**  
   ```js
   const token = req.cookies.token;
   ```
2. **Prüfung auf vorhandenes Token:**  
   ```js
   if (!token) {
     return res.status(401).json({ message: 'Nicht authentifiziert: Kein Token angegeben' });
   }
   ```
3. **Token-Verifizierung:**  
   ```js
   let decoded;
   try {
     decoded = jwt.verify(token, authConfig.JWT_SECRET);
   } catch (error) {
     res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
     return res.status(401).json({ message: `Nicht authentifiziert: ${error.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiges Token'}` });
   }
   ```
4. **Benutzerprüfung in der Datenbank:**  
   ```js
   try {
     const player = await db.Player.findByPk(decoded.id, { attributes: ['id', 'username', 'role', 'is_active'] });
     if (!player || !player.is_active) {
       res.clearCookie('token');
       return res.status(401).json({ message: 'Nicht authentifiziert: Benutzer nicht gefunden oder inaktiv' });
     }
     req.player = { id: player.id, username: player.username, role: player.role };
     next();
   } catch (dbError) {
     return res.status(500).json({ message: 'Serverfehler bei der Authentifizierung' });
   }
   ```

**Export:**
```js
module.exports = { authenticate };
```

---

## 4. Implementierungsplan: authorize-Middleware (Optional)

**Zweck:**  
Rollenbasierte Zugriffskontrolle (RBAC).

**Factory-Funktion:**
```js
const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.player) return res.status(401).json({ message: 'Nicht authentifiziert' });
    if (roles.length > 0 && !roles.includes(req.player.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
    }
    next();
  };
};
```

**Export:**
```js
module.exports = { authenticate, authorize };
```

---

## 5. Integration und Abhängigkeiten

- **cookie-parser:** Muss vor allen Routen, die authenticate nutzen, eingebunden werden.
- **Anwendung auf Routen:**  
  - authenticate für alle geschützten Endpunkte
  - authorize für rollenbasierte Endpunkte
- **Abhängigkeiten:**  
  - Ticket 0001 (Config)
  - Ticket 0002 (Player Model)
  - Ticket 0007 (cookie-parser)

---

## 6. Best Practices und Sicherheitsaspekte

- Korrekte Reihenfolge der Middleware
- Klare, aber nicht zu detaillierte Fehlermeldungen
- Cookie löschen bei ungültigen/abgelaufenen Tokens
- Effiziente Datenbankabfragen (nur benötigte Felder)
- JWT Secret Management (niemals hardcodiert)
- HTTPS in Produktion
- Sorgfältige Wahl der Token-Lebensdauer
- Korrekte Verwendung von async/await
- Fehlerbehandlung bei Datenbankoperationen

---

## 7. Häufige Probleme und Lösungsansätze

- JWT Verifizierungsfehler (falscher Secret, abgelaufen, manipuliert)
- Datenbankausfall oder -fehler
- Falsche Middleware-Reihenfolge
- Cookie wird nicht gesendet/empfangen (SameSite, Secure, Domain, Path, credentials: 'include')
- Explizites Logging von Fehlerdetails (error.name) zur schnellen Fehlersuche

---

## 8. Zusammenfassung und Akzeptanzkriterien

- Datei `server/middleware/authMiddleware.js` wird erstellt.
- authenticate validiert JWT, prüft Benutzerstatus, hängt req.player an, ruft next() auf oder sendet 401.
- authenticate löscht ungültige Cookies.
- authorize prüft Rollen, sendet 403 bei fehlender Berechtigung.
- Fehler werden korrekt behandelt und geloggt.
- Nach Implementierung: Einbindung in relevante API-Routen.

---

## 9. Anhang: Fehlerbehandlungstabelle (authenticate-Middleware)

| Bedingung | HTTP Status | Client-Nachricht | Serveraktion |
|-----------|-------------|------------------|-------------|
| Kein token-Cookie | 401 | Nicht authentifiziert: Kein Token angegeben | - |
| jwt.verify schlägt fehl (Signatur ungültig etc.) | 401 | Nicht authentifiziert: Ungültiges Token | res.clearCookie(...), Log error.name, error.message |
| jwt.verify schlägt fehl (Token abgelaufen) | 401 | Nicht authentifiziert: Token abgelaufen | res.clearCookie(...), Log error.name, error.message |
| db.Player.findByPk findet keinen Benutzer | 401 | Nicht authentifiziert: Benutzer nicht gefunden oder inaktiv | res.clearCookie(...) |
| is_active = false | 401 | Nicht authentifiziert: Benutzer nicht gefunden oder inaktiv | res.clearCookie(...) |
| Fehler bei db.Player.findByPk | 500 | Serverfehler bei der Authentifizierung | Log dbError Details |

---