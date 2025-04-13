# Ticket 0006: Auth Routen erstellen

**Einleitung:**

Dieses Ticket definiert die "Adressen" (URL-Pfade oder Endpunkte) unserer Authentifizierungs-API und legt fest, welche serverseitige Logik bei Anfragen an diese Adressen ausgeführt wird. Wir verwenden hierfür den Express Router, eine Mini-Anwendung innerhalb unserer Haupt-Express-Anwendung, die es uns erlaubt, alle Authentifizierungs-Routen sauber in einer eigenen Datei (`server/routes/authRoutes.js`) zu bündeln.

*   **Zweck der Routen:**
    *   **`POST /api/auth/register`:** Dies ist der Endpunkt, den das Registrierungsformular auf dem Client anspricht. Wenn eine `POST`-Anfrage hier eintrifft, wird sie (optional nach Validierung durch Ticket 0005) an die `register`-Funktion im `authController` (Ticket 0003) weitergeleitet.
    *   **`POST /api/auth/login`:** Der Endpunkt für das Login-Formular. Leitet Anfragen (optional nach Validierung) an die `login`-Funktion im `authController` weiter.
    *   **`POST /api/auth/logout`:** Der Endpunkt für den Logout-Button. Bevor die `logout`-Funktion im Controller aufgerufen wird, muss die `authenticate`-Middleware (Ticket 0004) erfolgreich durchlaufen werden, um sicherzustellen, dass der anfragende Benutzer überhaupt eingeloggt ist.
    *   **`GET /api/auth/me`:** Ein Endpunkt, den der Client nutzen kann, um die Daten des aktuell eingeloggten Benutzers abzufragen (z.B. um den Benutzernamen anzuzeigen oder zu prüfen, ob die Sitzung noch gültig ist). Auch hier muss zuerst die `authenticate`-Middleware den Benutzer validieren, bevor der `getCurrentUser`-Controller die Daten zurücksendet.

*   **Logik (Middleware-Kette):**
    *   Für jede Route definieren wir eine Kette von Funktionen (Middleware), die nacheinander ausgeführt werden.
    *   **Beispiel `/register` (mit optionalen Validatoren):**
        1.  Anfrage trifft ein: `POST /api/auth/register`
        2.  Express leitet zur ersten Middleware weiter: `registerValidator` (aus Ticket 0005). Diese prüft die Eingabedaten (`req.body`). Wenn Fehler gefunden werden, sendet der Validator eine 400-Antwort und die Kette wird abgebrochen.
        3.  Wenn keine Validierungsfehler: `next()` wird aufgerufen, Express leitet zur nächsten Funktion weiter: `authController.register` (aus Ticket 0003).
        4.  Der Controller führt die Registrierungslogik aus und sendet die finale Antwort (201 oder 500).
    *   **Beispiel `/me`:**
        1.  Anfrage trifft ein: `GET /api/auth/me`
        2.  Express leitet zur ersten Middleware weiter: `authenticate` (aus Ticket 0004). Diese prüft das Cookie, validiert das JWT, lädt den Benutzer und hängt `req.player` an. Wenn ein Fehler auftritt (kein Token, ungültig, etc.), sendet die Middleware eine 401-Antwort und bricht ab.
        3.  Wenn `authenticate` erfolgreich war: `next()` wird aufgerufen, Express leitet weiter zu `authController.getCurrentUser` (aus Ticket 0003).
        4.  Der Controller liest `req.player` und sendet die Daten als 200-Antwort zurück.

Diese Routendefinitionen bilden die klar definierte Schnittstelle (API) zwischen dem Client und der serverseitigen Authentifizierungslogik und steuern den Ablauf der Anfragebearbeitung durch die Middleware-Kette.

---

**Ziel:** Definieren der API-Endpunkte für die Authentifizierungsfunktionen und Verknüpfen dieser Endpunkte mit den entsprechenden Controllern und Middleware.

**Abhängigkeiten:** Ticket 0003 (Auth Controller), Ticket 0004 (Auth Middleware), Optional: Ticket 0005 (Auth Validatoren)

**Aufgaben:**

1.  **Datei erstellen:** `server/routes/authRoutes.js`.
2.  **Imports hinzufügen:**
    ```javascript
    const express = require('express');
    const authController = require('../controllers/authController'); // Pfad anpassen
    // Importiere nur die benötigten Middleware-Funktionen
    const { authenticate } = require('../middleware/authMiddleware'); // Pfad anpassen
    // Optional: Importiere Validatoren, falls Ticket 0005 umgesetzt wird
    // const { registerValidator, loginValidator } = require('../validators/authValidators'); // Pfad anpassen
    ```
3.  **Express Router initialisieren:**
    ```javascript
    const router = express.Router();
    ```
4.  **Routen definieren:**
    *   **Registrierung:** `POST /register`
        *   Middleware: `registerValidator` (optional), `authController.register` (Handler)
        ```javascript
        // Beispiel mit optionalen Validatoren:
        // router.post('/register', registerValidator, authController.register);
        // Beispiel ohne Validatoren:
        router.post('/register', authController.register);
        ```
    *   **Login:** `POST /login`
        *   Middleware: `loginValidator` (optional), `authController.login` (Handler)
        ```javascript
        // Beispiel mit optionalen Validatoren:
        // router.post('/login', loginValidator, authController.login);
        // Beispiel ohne Validatoren:
        router.post('/login', authController.login);
        ```
    *   **Logout:** `POST /logout`
        *   Middleware: `authenticate` (erforderlich), `authController.logout` (Handler)
        ```javascript
        // 'authenticate' stellt sicher, dass nur eingeloggte Benutzer sich ausloggen können
        // und dass wir wissen, wessen Cookie wir löschen sollen (obwohl clearCookie global ist)
        router.post('/logout', authenticate, authController.logout);
        ```
    *   **Aktuellen Benutzer abrufen:** `GET /me`
        *   Middleware: `authenticate` (erforderlich), `authController.getCurrentUser` (Handler)
        ```javascript
        // 'authenticate' validiert das Token und stellt req.player bereit
        router.get('/me', authenticate, authController.getCurrentUser);
        ```
5.  **Router exportieren:**
    ```javascript
    module.exports = router;
    ```

**Best Practices & Überlegungen:**

*   **Präfix:** Der Präfix `/api/auth` wird in `server/index.js` (Ticket 0007) hinzugefügt, daher definieren wir hier nur die relativen Pfade (`/register`, `/login` etc.).
*   **Middleware-Reihenfolge:** Die Reihenfolge der Middleware ist wichtig. Validatoren sollten zuerst kommen, dann Authentifizierung (`authenticate`), dann Autorisierung (`authorize`, falls verwendet), und zuletzt der Controller-Handler.
*   **HTTP-Methoden:** Verwende die korrekten HTTP-Methoden (POST für Aktionen, die Daten erstellen/ändern, GET für das Abrufen von Daten).
*   **Ressourcen-Benennung:** Die Pfade (`/register`, `/login`, `/logout`, `/me`) sind gängige Konventionen für Authentifizierungs-APIs.

**Mögliche Probleme & Risiken:**

*   **Falsche Pfade/Methoden:** Client und Server verwenden unterschiedliche Pfade oder HTTP-Methoden.
*   **Fehlende Middleware:** Wenn `authenticate` bei geschützten Routen fehlt, kann jeder darauf zugreifen.
*   **Falsche Middleware-Reihenfolge:** Kann zu unerwartetem Verhalten oder Fehlern führen.
*   **Import-Fehler:** Falsche Pfade in `require`-Anweisungen.

**Akzeptanzkriterien:**

*   Die Datei `server/routes/authRoutes.js` existiert.
*   Die Routen `POST /register`, `POST /login`, `POST /logout` und `GET /me` sind korrekt mit den entsprechenden HTTP-Methoden definiert.
*   Die Routen sind korrekt mit den Funktionen aus `authController` als finale Handler verknüpft.
*   Die `authenticate`-Middleware wird korrekt als vorgeschaltete Middleware für die Routen `/logout` und `/me` verwendet.
*   *(Optional)* Die Validatoren aus `authValidators` werden korrekt als erste Middleware für die Routen `/register` und `/login` verwendet (falls Ticket 0005 umgesetzt wurde).
*   Der Router wird korrekt exportiert.