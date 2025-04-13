# Ticket 0009: Client Socket Handler anpassen

**Einleitung:**

Dieses Ticket konzentriert sich auf das `socketHandler.js`-Modul auf der Client-Seite. Dieses Modul ist verantwortlich für den Aufbau und die Verwaltung der Echtzeit-Kommunikation mit dem Server über Socket.io. Da wir das serverseitige Authentifizierungssystem auf JWT umgestellt haben (siehe Ticket 0007), müssen wir nun den Client anpassen, damit er sich korrekt beim Socket.io-Server authentifiziert. Die Authentifizierung bei Socket.io erfolgt während des Verbindungsaufbaus (Handshake).

*   **Zweck der Änderungen:**
    *   **Authentifizierungsmethode ändern:** Statt einer Session-ID, die früher im `localStorage` gespeichert und im `auth`-Objekt übergeben wurde, muss der Client nun das JWT (das als `httpOnly` Cookie gespeichert ist) lesen und im `auth`-Objekt an den Socket.io-Server senden. Da `httpOnly` Cookies nicht direkt von JavaScript gelesen werden können, ist der Ansatz aus der Dokumentation (Token aus Cookie lesen) hier **nicht direkt umsetzbar**.
        *   **Alternative/Korrekter Ansatz:** Das JWT sollte *nicht* im Cookie gespeichert werden, wenn es auch für die Socket.io-Authentifizierung benötigt wird. Eine gängige Methode ist, das Token nach dem Login/Register vom Server sowohl als Cookie (für HTTP-Requests) als auch im Response-Body zu senden. Der Client speichert das Token aus dem Body dann im `localStorage` (oder `sessionStorage`) und liest es von dort, um es im `auth`-Objekt an Socket.io zu senden. **Wir müssen also auch Ticket 0003 (Controller) und Ticket 0008 (Client Auth Logik) entsprechend anpassen!**
    *   **Session-ID-Logik entfernen:** Jeglicher Code, der sich auf das Lesen, Schreiben oder Überprüfen der alten `sessionId` im `localStorage` bezieht, muss entfernt werden.
    *   **Fehlerbehandlung anpassen:** Die Behandlung von Verbindungsfehlern (`connect_error`) muss angepasst werden. Wenn der Server die Authentifizierung ablehnt (weil das Token fehlt, ungültig oder abgelaufen ist), sollte der Client den Benutzer zur Login-Seite umleiten und das ungültige Token aus dem `localStorage` entfernen.

*   **Logik (Angepasster Ansatz):**
    1.  **Ticket 0003 & 0008 anpassen:** Server sendet Token zusätzlich im Body, Client speichert es im `localStorage`. Client löscht Token aus `localStorage` beim Logout.
    2.  **`connectToServer` anpassen:** Liest das Token aus dem `localStorage` (statt Cookie).
    3.  Sendet dieses Token im `auth`-Objekt des `io()`-Aufrufs an den Server.
    4.  Wenn kein Token im `localStorage` gefunden wird, wird die Verbindung nicht aufgebaut und der Benutzer zum Login umgeleitet.
    5.  Im `connect_error`-Handler wird bei Authentifizierungsfehlern das Token aus dem `localStorage` entfernt und zum Login umgeleitet.

Diese Anpassungen stellen sicher, dass der Socket.io-Client die neue JWT-basierte Authentifizierungsmethode des Servers verwendet und die veraltete Session-ID-Logik entfernt wird.

---

**Ziel:** Anpassen des `socketHandler.js` Moduls, um das JWT (aus dem `localStorage`) für die Socket.io-Authentifizierung zu verwenden.

**Abhängigkeiten:** Angepasstes Ticket 0003 & 0008 (Token im localStorage), Ticket 0007 (Angepasste Socket.io Middleware auf dem Server)

**Aufgaben:**

1.  **WICHTIG:** Stelle sicher, dass die Änderungen aus dem überarbeiteten Plan für Ticket 0003 (Server sendet Token auch im Body) und Ticket 0008 (Client speichert/löscht Token im localStorage) umgesetzt werden!
2.  **Datei öffnen:** `client/js/modules/socketHandler.js`.
3.  **`connectToServer` Funktion anpassen:**
    *   Entferne den `sessionId`-Parameter.
    *   Entferne die Prüfung auf `!sessionId`.
    *   **Token aus `localStorage` lesen:**
        ```javascript
        const token = localStorage.getItem('authToken'); // Oder wie auch immer der Key heißt

        if (!token) {
           console.error('FEHLER: connectToServer aufgerufen, aber kein Auth-Token im localStorage gefunden!');
           window.location.href = '/login.html'; // Umleiten zum Login
           return; // Verhindere Verbindungsversuch
        }
        console.log(`Versuche Socket-Verbindung zu ${serverUrl} mit Token aus localStorage...`);
        ```
    *   **Token im `auth`-Objekt senden:**
        ```javascript
        socket = io(serverUrl, {
          auth: {
            token: token // Sende das Token aus localStorage
          }
          // Optional: reconnection: false, // Verhindert automatische Reconnects bei Auth-Fehler
        });
        ```
    *   Entferne Log-Nachrichten, die die Session-ID erwähnen.
4.  **`connect_error`-Handler anpassen:**
    *   Bei Fehlern wie `Nicht authentifiziert`, `Ungültiges oder abgelaufenes Token`:
        ```javascript
        socket.on('connect_error', (error) => {
            console.error('Verbindungsfehler:', error.message);
            if (error.message.startsWith('Nicht authentifiziert')) {
                // Session ist ungültig oder abgelaufen
                console.error('Socket-Authentifizierung fehlgeschlagen. Entferne Token und leite zum Login um.');
                localStorage.removeItem('authToken'); // Token entfernen
                // Optional: localStorage.removeItem('username'); // Auch Username entfernen
                window.location.href = '/login.html';
                // Verhindere weitere Reconnect-Versuche, falls aktiviert
                if (socket) socket.disconnect();
            }
            // Hier könnten weitere Fehlerbehandlungen implementiert werden
        });
        ```
5.  **Globale Variablen/Funktionen:**
    *   Die `getMyId`-Funktion ist weiterhin sinnvoll.

**Best Practices & Überlegungen:**

*   **Token-Speicherort:** `localStorage` ist anfällig für XSS-Angriffe. Wenn möglich, ist das Speichern im Speicher (JavaScript-Variable) und erneutes Abrufen bei Seiten-Neuladen (z.B. über `/api/auth/me`) sicherer, aber komplexer. Für dieses Projekt ist `localStorage` wahrscheinlich ein akzeptabler Kompromiss, solange XSS-Risiken minimiert werden. `sessionStorage` wäre eine Alternative, wenn das Token nur für die Dauer der Browser-Sitzung gültig sein soll.
*   **Token-Handling:** Stelle sicher, dass das Token zuverlässig im `localStorage` gespeichert wird (nach Login/Register) und gelöscht wird (nach Logout oder bei Auth-Fehlern).
*   **Socket.io Reconnection:** Bei Authentifizierungsfehlern ist es oft sinnvoll, automatische Reconnect-Versuche zu deaktivieren (`reconnection: false`), da sie ohne gültiges Token ohnehin fehlschlagen würden.

**Mögliche Probleme & Risiken:**

*   **Token nicht im `localStorage`:** Wenn das Speichern in Ticket 0008 fehlschlägt, kann sich der Socket nicht verbinden.
*   **Veraltetes Token im `localStorage`:** Wenn das Logout fehlschlägt oder der Benutzer den Tab schließt, ohne sich auszuloggen, könnte ein abgelaufenes Token im Speicher bleiben. Der `connect_error`-Handler sollte dies abfangen.
*   **XSS:** Wenn die Anwendung anfällig für XSS ist, könnte ein Angreifer das Token aus dem `localStorage` stehlen.

**Akzeptanzkriterien:**

*   Die `connectToServer`-Funktion liest das Token aus dem `localStorage`.
*   Das gelesene Token wird im `auth`-Objekt an den Socket.io-Server gesendet.
*   Die Logik zum Lesen/Schreiben der alten `sessionId` ist entfernt.
*   Der `connect_error`-Handler entfernt bei Authentifizierungsfehlern das Token aus dem `localStorage` und leitet zum Login um.
*   Die Socket.io-Verbindung wird erfolgreich mit dem neuen Authentifizierungsmechanismus hergestellt, wenn ein gültiges Token im `localStorage` vorhanden ist.