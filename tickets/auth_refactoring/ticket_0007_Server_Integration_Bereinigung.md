# Ticket 0007: Server Integration & Bereinigung

**Einleitung:**

Dieses Ticket ist der entscheidende Schritt, um die in den vorherigen Tickets erstellten Authentifizierungskomponenten (neue Routen, Middleware, Controller) in die Haupt-Serverdatei (`server/index.js`) zu integrieren. Gleichzeitig räumen wir auf, indem wir die alte, nun überflüssige Session-basierte Logik entfernen. Ziel ist es, dass der Server nach Abschluss dieses Tickets ausschließlich das neue JWT/Cookie-System für die Authentifizierung von HTTP-API-Anfragen und Socket.io-Verbindungen verwendet.

*   **Zweck der Integration:**
    *   **`cookie-parser` einbinden:** Diese Express-Middleware muss *früh* im Anfragezyklus eingebunden werden. Sie parst die `Cookie`-Header von eingehenden HTTP-Anfragen und macht die Cookies als Objekt unter `req.cookies` verfügbar. Dies ist notwendig, damit unsere `authenticate`-Middleware (Ticket 0004) auf das `token`-Cookie zugreifen kann.
    *   **Auth-Routen registrieren:** Wir müssen Express mitteilen, dass alle Anfragen, deren Pfad mit `/api/auth` beginnt (z.B. `/api/auth/login`), von unserem speziell dafür erstellten `authRoutes`-Router (Ticket 0006) behandelt werden sollen. Dieser Router enthält dann die spezifischen Endpunkte wie `/login`, `/register` etc.
    *   **Socket.io-Middleware aktualisieren:** Socket.io hat sein eigenes Middleware-System (`io.use(...)`), das bei *jeder neuen Verbindungsanfrage* ausgeführt wird, bevor die eigentliche `connection`-Event ausgelöst wird. Wir ersetzen die alte Middleware (die eine Session-ID prüfte) durch eine neue, die das vom Client gesendete JWT (im `socket.handshake.auth.token`-Feld, siehe Ticket 0009) validiert. Diese neue Middleware nutzt `jwt.verify` und prüft den Benutzer in der Datenbank, ähnlich wie die `authenticate`-Middleware für HTTP. Bei Erfolg hängt sie die Benutzerdaten an das `socket`-Objekt (`socket.player`), sodass wir in den Socket-Event-Handlern (`move`, `chat-message` etc.) wissen, welcher Benutzer die Anfrage sendet. Bei einem Fehler wird die Verbindung abgelehnt (`next(new Error(...))`).

*   **Zweck der Bereinigung:**
    *   **Alte API-Routen entfernen:** Die alten, direkt in `server/index.js` definierten Handler für `/api/login`, `/api/logout`, `/api/check-session` werden entfernt, da ihre Funktionalität nun von den neuen Routen unter `/api/auth` übernommen wird. Dies vermeidet Konflikte und hält die Hauptdatei sauber.
    *   **Alte Session-Logik entfernen:** Die globalen Variablen (`sessions`, `sessionToSocket`, `socketToSession`) und die Funktion `generateSessionId`, die zur Verwaltung der alten, im Serverspeicher gehaltenen Sessions dienten, werden komplett entfernt. Das JWT-System ist zustandslos auf Serverseite bezüglich der Sitzung selbst (der Zustand ist im Token auf Client-Seite).
    *   **Socket.io-Handler anpassen:** Die bestehenden Handler für `connection`, `move`, `chat-message`, `disconnect` müssen angepasst werden. Statt auf die alten Session-Variablen zuzugreifen, um den Benutzer zu identifizieren, greifen sie nun auf das `socket.player`-Objekt zu, das von der neuen Socket.io-Middleware gesetzt wird.

Nach Abschluss dieses Tickets sollte der Server strukturell sauberer sein und vollständig auf das neue, sicherere und zustandslose (bezüglich Sessions) JWT/Cookie-Authentifizierungssystem umgestellt sein.

---

**Ziel:** Integrieren der neuen Authentifizierungs-Komponenten (Routen, Middleware) in die Haupt-Serverdatei (`server/index.js`) und Entfernen der alten Session-basierten Logik sowie Anpassen der Socket.io-Authentifizierung.

**Abhängigkeiten:** Ticket 0001 (cookie-parser), Ticket 0004 (Auth Middleware), Ticket 0006 (Auth Routen)

**Aufgaben:**

1.  **Datei öffnen:** `server/index.js`.
2.  **Notwendige Module importieren:**
    *   Stelle sicher, dass `cookie-parser` importiert ist: `const cookieParser = require('cookie-parser');`.
    *   Importiere die neuen Auth-Routen: `const authRoutes = require('./routes/authRoutes');` (Pfad anpassen).
    *   Importiere JWT, die Auth-Konfiguration und das DB-Modell für die Socket.io-Middleware:
        ```javascript
        const jwt = require('jsonwebtoken');
        const authConfig = require('./config/auth'); // Pfad anpassen
        const db = require('./models'); // Sicherstellen, dass db importiert ist
        ```
3.  **Middleware einbinden:** Füge `cookieParser` zur Express-App (`webApp`) hinzu, *bevor* die Routen eingebunden werden, die Cookies benötigen:
    ```javascript
    // Direkt nach webApp = express(); oder anderen globalen Middlewares wie CORS
    webApp.use(cookieParser());
    webApp.use(express.json()); // Bereits vorhanden
    ```
4.  **Auth-Routen einbinden:** Binde die neuen Routen unter dem Präfix `/api/auth` ein:
    ```javascript
    webApp.use('/api/auth', authRoutes);
    ```
5.  **Alte API-Routen entfernen:** Suche und lösche die `webApp.post('/api/login', ...)`-, `webApp.post('/api/logout', ...)`- und `webApp.post('/api/check-session', ...)`-Handler vollständig.
6.  **Alte Session-Logik entfernen:** Suche und lösche die Definitionen der globalen Variablen `sessions`, `sessionToSocket`, `socketToSession` und die Funktion `generateSessionId`.
7.  **Socket.io-Middleware (`io.use`) anpassen/ersetzen:** Ersetze die vorhandene `io.use`-Middleware durch die neue Logik, die das JWT aus `socket.handshake.auth.token` validiert:
    ```javascript
    io.use(async (socket, next) => {
      try {
        // Token wird vom Client im 'auth' Objekt erwartet (siehe Ticket 0009)
        const token = socket.handshake.auth.token;
        if (!token) {
          console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Kein Token übermittelt.`);
          // Fehlerobjekt an next() übergeben, um Verbindung abzulehnen
          return next(new Error('Nicht authentifiziert: Kein Token'));
        }

        // Token verifizieren (Signatur & Ablaufdatum)
        const decoded = jwt.verify(token, authConfig.JWT_SECRET);

        // Spieler aus DB laden, um Existenz und Aktivität zu prüfen
        const player = await db.Player.findByPk(decoded.id, {
          attributes: ['id', 'username', 'role', 'is_active'] // Nur benötigte Felder
        });

        if (!player || !player.is_active) {
          console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Ungültiger Spieler (ID: ${decoded.id}) oder inaktiv.`);
          return next(new Error('Nicht authentifiziert: Ungültiger Spieler'));
        }

        // Spielerdaten an das Socket-Objekt anhängen für spätere Verwendung in Event-Handlern
        socket.player = { id: player.id, username: player.username, role: player.role };
        console.log(`Socket Auth erfolgreich für ${socket.player.username} (${socket.id})`);
        next(); // Authentifizierung erfolgreich, Verbindung erlauben

      } catch (error) {
        // Fehler beim Verifizieren (ungültig, abgelaufen) oder DB-Fehler
        console.error(`Socket Auth Fehler (${socket.id}):`, error.message);
        // Spezifische Fehlermeldung für den Client
        const clientErrorMessage = (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError')
                           ? 'Ungültiges oder abgelaufenes Token'
                           : 'Authentifizierungsfehler';
        next(new Error(`Nicht authentifiziert: ${clientErrorMessage}`)); // Verbindung ablehnen
      }
    });
    ```
8.  **Socket.io-Event-Handler anpassen:**
    *   **`io.on('connection', (socket) => { ... })`:**
        *   Ersetze die alte Logik zum Abrufen von `sessionId`/`username` durch:
          ```javascript
          const playerInfo = socket.player;
          // Diese Prüfung sollte eigentlich nicht mehr nötig sein, wenn io.use korrekt funktioniert,
          // aber als Sicherheitsnetz schadet sie nicht.
          if (!playerInfo) {
            console.error(`FEHLER: socket.player nicht gesetzt für Socket ${socket.id} nach erfolgreicher Verbindung!`);
            socket.disconnect(true); // Verbindung sofort trennen
            return;
          }
          console.log(`Verbunden: ${playerInfo.username} (${socket.id})`);
          ```
        *   Verwende `playerInfo.username` und `playerInfo.id` in Log-Nachrichten, DB-Abfragen (`where: { username: playerInfo.username }`) und beim Senden von Events (`player-joined`).
    *   **`socket.on('move', (pos) => { ... })`:**
        *   Füge am Anfang eine Prüfung hinzu: `if (!socket.player) { console.warn(`Move Event von nicht authentifiziertem Socket ${socket.id}`); return; }`.
        *   Verwende `socket.player.username` für die DB-Abfrage (`where: { username: socket.player.username }`) und im `player-moved`-Event.
    *   **`socket.on('chat-message', (message) => { ... })`:**
        *   Füge am Anfang eine Prüfung hinzu: `if (!socket.player) { console.warn(`Chat Event von nicht authentifiziertem Socket ${socket.id}`); return; }`.
        *   Verwende `socket.player.username` als `sender` und `socket.player.id` als `senderId`.
    *   **`socket.on('disconnect', () => { ... })`:**
        *   Entferne die Bereinigung von `sessionToSocket` und `socketToSession`.
        *   Verwende `socket.player?.username || socket.id` für die Log-Nachricht (das `?.` ist wichtig, falls `disconnect` vor erfolgreicher Auth passiert).

**Best Practices & Überlegungen:**

*   **Middleware-Reihenfolge:** Stelle sicher, dass `cookieParser()` vor `authRoutes` verwendet wird.
*   **Socket.io Auth:** Die `io.use`-Middleware ist der Standardweg zur Authentifizierung von Socket.io-Verbindungen. Das Senden des Tokens im `auth`-Objekt vom Client ist ebenfalls Standard.
*   **Fehlerbehandlung Socket.io:** Das Übergeben eines `Error`-Objekts an `next()` in `io.use` lehnt die Verbindung ab und sendet den Fehler an den `connect_error`-Handler des Clients.
*   **Zustandslosigkeit:** Der Server speichert keine Session-Informationen mehr im Speicher. Jede Anfrage (HTTP oder Socket-Nachricht) muss anhand des mitgesendeten Tokens validiert werden.
*   **Sicherheit:** Stelle sicher, dass CORS-Einstellungen (`cors: { origin: '*' }` im `new Server`-Aufruf) für die Produktion korrekt konfiguriert sind, um nur Anfragen von erlaubten Domains zuzulassen.

**Mögliche Probleme & Risiken:**

*   **Fehlende/Falsche Imports:** Server startet nicht oder Funktionen sind nicht verfügbar.
*   **Falsche Middleware-Reihenfolge:** `cookieParser` nach den Routen führt dazu, dass `req.cookies` undefiniert ist.
*   **Fehler in `io.use`:** Wenn die Socket-Middleware Fehler enthält, können sich Clients möglicherweise nicht verbinden oder unauthentifizierte Verbindungen werden zugelassen.
*   **Inkonsistente Benutzerdaten:** Wenn `socket.player` in den Event-Handlern nicht korrekt verwendet wird, könnten Aktionen dem falschen Benutzer zugeordnet werden.
*   **CORS-Probleme:** Wenn Client und Server auf unterschiedlichen Ports/Domains laufen, müssen CORS-Header für die HTTP-API und die Socket.io-Verbindung korrekt gesetzt sein.

**Akzeptanzkriterien:**

*   `cookie-parser` wird korrekt als Express-Middleware verwendet.
*   Die neuen Auth-Routen (`/api/auth/*`) sind korrekt in die Express-App eingebunden.
*   Die alten Session-basierten API-Routen und die zugehörige globale Session-Logik sind vollständig aus `server/index.js` entfernt.
*   Die Socket.io-Middleware (`io.use`) validiert das JWT aus `socket.handshake.auth.token` korrekt, lehnt ungültige Verbindungen ab und hängt `socket.player` bei Erfolg an das Socket-Objekt.
*   Die Socket.io-Event-Handler (`connection`, `move`, `chat-message`, `disconnect`) verwenden `socket.player` korrekt zur Identifizierung des Benutzers.
*   Der Server startet ohne Fehler und die grundlegenden Funktionen (Login, Logout, /me, Socket-Verbindung, Bewegung, Chat, Trennung) funktionieren wie erwartet mit dem neuen JWT/Cookie-Authentifizierungssystem.