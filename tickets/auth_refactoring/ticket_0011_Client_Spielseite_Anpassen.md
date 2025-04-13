# Ticket 0011: Client Spielseite (game.js) anpassen

**Einleitung:**

Dieses Ticket befasst sich mit der Anpassung der zentralen Steuerungsdatei des Clients, `client/js/game.js`. Diese Datei fungiert als Haupt-Einstiegspunkt für das eigentliche Spiel, nachdem der Benutzer sich eingeloggt hat. Sie ist verantwortlich für die Initialisierung aller notwendigen Spielmodule (wie Renderer für die Grafik, Player für die Steuerung, UI-Manager, Socket-Handler für die Netzwerkkommunikation etc.) und die Orchestrierung des Spielablaufs. Da wir das Authentifizierungssystem grundlegend geändert haben (weg von `localStorage`-Sessions hin zu JWT/Cookies und einer API-Prüfung), müssen wir `game.js` anpassen, um sicherzustellen, dass nur authentifizierte Benutzer das Spiel laden können und dass die Kommunikation mit anderen Modulen (insbesondere `socketHandler` und der neuen `auth.js`-Logik) korrekt funktioniert.

*   **Zweck der Änderungen:**
    *   **Authentifizierungsprüfung beim Start:** Der wichtigste Schritt ist, *bevor* irgendein Spielmodul geladen wird, zu überprüfen, ob der Benutzer eine gültige, aktive Sitzung beim Server hat. Anstatt wie bisher nur im `localStorage` nach einer `sessionId` zu suchen (was unsicher und unzuverlässig ist), rufen wir nun die neue `checkAuth()`-Funktion (aus Ticket 0008) auf. Diese Funktion sendet eine Anfrage an den `/api/auth/me`-Endpunkt des Servers. Der Browser hängt das `token`-Cookie automatisch an (dank `credentials: 'include'`). Nur wenn der Server mit Status 200 und gültigen Benutzerdaten antwortet, wissen wir sicher, dass der Benutzer eingeloggt ist. Ist dies nicht der Fall (z.B. kein Cookie, ungültiges/abgelaufenes Token, Benutzer inaktiv), wird der Benutzer sofort zur Login-Seite (`/login.html`) umgeleitet, und die weitere Initialisierung von `game.js` wird abgebrochen. Dies schützt die Spielseite vor unbefugtem Zugriff.
    *   **Entfernung alter Logik:** Jeglicher Code, der sich auf das Lesen, Schreiben oder Übergeben der alten `sessionId` aus dem `localStorage` bezog, muss entfernt werden. Das betrifft vor allem den Initialisierungsteil und den Aufruf der `connectToServer`-Funktion im `socketHandler`, die nun keine Session-ID mehr benötigt.
    *   **Logout-Anpassung:** Die Funktion (`handleLogout`), die typischerweise durch einen Klick auf einen "Abmelden"-Button im Spiel-UI ausgelöst wird, muss angepasst werden. Sie soll nun die neue `logout()`-Funktion aus der Client-Auth-Logik (Ticket 0008) aufrufen. Diese Funktion kümmert sich um den API-Aufruf an den Server (der das Cookie löscht) und die anschließende Umleitung zur Login-Seite. Zusätzliche Aufräumarbeiten wie das Stoppen der Rendering-Schleife oder das Entfernen von Event-Listenern sollten ebenfalls hier oder in der `logout`-Funktion selbst erfolgen.

*   **Logik:**
    *   Wir wandeln den `DOMContentLoaded`-Event-Listener in eine `async`-Funktion um, damit wir `await` für den `checkAuth()`-Aufruf verwenden können.
    *   Ganz am Anfang dieses Listeners erfolgt der `await checkAuth()`. Das Ergebnis wird geprüft.
    *   Bei fehlender Authentifizierung (`checkAuth` gibt `null` zurück oder wirft einen Fehler) erfolgt `window.location.href = '/login.html';` und `return;`.
    *   Bei erfolgreicher Authentifizierung werden die Benutzerdaten (z.B. `username`) aus dem Ergebnis extrahiert und für die weitere Initialisierung verwendet (z.B. Anzeige im UI).
    *   Der Aufruf von `connectToServer` (Ticket 0009) erfolgt nun ohne das `sessionId`-Argument.
    *   Die `handleLogout`-Funktion wird überarbeitet, um die neue `logout()`-Funktion (Ticket 0008) aufzurufen und ggf. notwendige Spiel-Aufräumaktionen durchzuführen.
    *   Alle Verwendungen von `localStorage.getItem('sessionId')` oder `localStorage.removeItem('sessionId')` werden entfernt.

Diese Anpassungen stellen sicher, dass die Spielseite (`game.html` und `game.js`) nahtlos und sicher in den neuen Authentifizierungs-Workflow integriert ist.

---

**Ziel:** Anpassen der Haupt-Spiellogik (`client/js/game.js`), um die neue Authentifizierungsprüfung zu verwenden und die alte Session-ID-Logik zu entfernen.

**Abhängigkeiten:** Ticket 0008 (Client Auth-Logik), Ticket 0009 (Client Socket Handler)

**Aufgaben:**

1.  **Datei öffnen:** `client/js/game.js`.
2.  **Imports anpassen:**
    *   Importiere die `checkAuth`- und `logout`-Funktionen aus der Auth-Logik (Ticket 0008), z.B.:
      ```javascript
      import { checkAuth, logout } from './auth.js'; // Pfad ggf. anpassen
      // Stelle sicher, dass auch andere benötigte Module importiert werden
      import { connectToServer, registerCallbacks as registerSocketCallbacks, emitChatMessage, emitMove, getMyId, isConnected } from './modules/socketHandler.js';
      import { initUIManager, registerCallbacks as registerUICallbacks, updateUsername, updatePlayersList } from './modules/uiManager.js';
      import { initPlayerControls, cleanupPlayerControls /* ... */ } from './modules/player.js';
      import { initRenderer, stopRendering /* ... */ } from './modules/renderer.js';
      // ... weitere Imports ...
      ```
    *   Entferne ggf. alte Imports oder Variablen, die sich auf die `sessionId` bezogen.
3.  **Initialisierungssequenz (`DOMContentLoaded` Event-Listener) anpassen:**
    *   **Authentifizierungsprüfung:** Mache den Listener `async` und führe die `checkAuth()`-Prüfung *vor* der restlichen Initialisierung durch.
        ```javascript
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('DOM fully loaded. Initializing game...');

            let playerInfo = null; // Variable für die Spielerdaten vom Server

            try {
                // Prüfe Auth-Status über API VOR allem anderen
                const authData = await checkAuth();
                if (!authData || !authData.player) {
                    // Nicht authentifiziert oder Fehler bei der Prüfung
                    console.error('Nicht authentifiziert oder Fehler bei checkAuth. Umleitung zum Login.');
                    window.location.href = '/login.html'; // Leite sofort um
                    return; // Verhindere weitere Ausführung
                }
                // Authentifizierung erfolgreich, speichere Spielerdaten
                playerInfo = authData.player;
                console.log(`Authentifiziert als: ${playerInfo.username}`);

            } catch (error) {
                // Fängt Netzwerkfehler oder andere Fehler von checkAuth ab
                console.error('Fehler bei der Authentifizierungsprüfung:', error);
                window.location.href = '/login.html'; // Bei Fehler zum Login umleiten
                return;
            }

            // --- Ab hier nur fortfahren, wenn authentifiziert ---
            // Der Benutzername ist jetzt in playerInfo.username verfügbar

            try {
                // UI initialisieren und Username anzeigen
                initUIManager(); // Muss vor updateUsername aufgerufen werden
                updateUsername(playerInfo.username);

                // --- Restliche Initialisierung (Module, Callbacks, connectToServer) ---
                const canvasElement = document.getElementById('gameCanvas');
                if (!canvasElement) throw new Error("Canvas element not found!");

                const rendererInitialized = initRenderer(canvasElement);
                if (!rendererInitialized) throw new Error("Renderer-Fehler.");

                initPlayerControls(canvasElement);
                initChat();
                initInventory(); // Lädt aktuell nur Beispiel-Inventar
                initPokemon();   // Lädt aktuell nur Beispiel-Team/Lager

                // Callbacks registrieren
                registerSocketCallbacks({ /* ... Callbacks ... */ });
                registerUICallbacks({ onSaveSettings: handleSaveSettings, onLogout: handleLogout });

                // Verbindung zum Server herstellen (ohne sessionId)
                // Der SocketHandler (Ticket 0009) liest das Token aus dem Cookie/localStorage
                connectToServer('http://localhost:3001', playerInfo.username); // Übergabe username optional für Logging

                console.log("Game initialization sequence complete (authenticated).");
                // Rendering wird in handleInit gestartet, nachdem die Serverdaten da sind

            } catch(initError) {
                 console.error("Fehler während der Spielinitialisierung:", initError);
                 alert("Ein Fehler ist bei der Initialisierung des Spiels aufgetreten. Bitte versuche es später erneut.");
                 // Ggf. auch hier zum Login umleiten oder eine Fehlerseite anzeigen
                 // window.location.href = '/login.html';
            }
        });
        ```
    *   **`connectToServer`-Aufruf:** Stelle sicher, dass das `sessionId`-Argument entfernt wurde. Der `socketHandler` (Ticket 0009) ist nun dafür verantwortlich, das Token zu beschaffen und zu senden.
4.  **Logout-Handler (`handleLogout`) anpassen:**
    *   Ersetze den Inhalt der Funktion durch einen Aufruf der neuen `logout()`-Funktion aus der Auth-Logik (Ticket 0008). Füge notwendige Aufräumaktionen hinzu.
    ```javascript
    function handleLogout() {
        console.log("Logout requested by user.");
        // Spiel anhalten und Ressourcen freigeben
        stopRendering();
        cleanupPlayerControls();
        // Optional: Weitere Aufräumaktionen hier

        // Rufe die neue Logout-Funktion auf (diese kümmert sich um API-Call und Redirect)
        logout().catch(error => {
            // Optional: Fehler beim Logout-API-Call behandeln,
            // aber die Umleitung sollte in logout() trotzdem erfolgen.
            console.error("Fehler während des Logout-API-Aufrufs:", error);
        });
    }
    ```
    *   Entferne die `forceLogout`-Hilfsfunktion, wenn sie nicht mehr benötigt wird.
5.  **Code bereinigen:** Suche global im Client-Code (insbesondere in `game.js` und ggf. anderen Modulen) nach `localStorage.getItem('sessionId')`, `localStorage.removeItem('sessionId')` und ähnlichen Vorkommen und entferne sie.

**Best Practices & Überlegungen:**

*   **Asynchrone Initialisierung:** Der `DOMContentLoaded`-Listener ist nun `async`, da `checkAuth` eine Netzwerk-Anfrage ist. Stelle sicher, dass die weitere Initialisierung erst nach erfolgreicher Prüfung erfolgt.
*   **Fehlerbehandlung:** Eine robuste Fehlerbehandlung während der Initialisierung ist wichtig. Wenn `checkAuth` oder ein anderer Initialisierungsschritt fehlschlägt, sollte der Benutzer informiert und ggf. zum Login zurückgeleitet werden.
*   **State Management:** Überlege, ob die von `checkAuth` zurückgegebenen Spielerdaten (`playerInfo`) zentral gespeichert werden sollten (z.B. in einem globalen State-Objekt oder einem State-Management-System, falls React/Vue etc. verwendet wird), damit andere Module darauf zugreifen können, ohne `/api/auth/me` erneut aufrufen zu müssen.
*   **Aufräumen beim Logout:** Stelle sicher, dass alle notwendigen Aufräumarbeiten (Rendering stoppen, Event Listener entfernen) beim Logout durchgeführt werden, um Speicherlecks oder unerwartetes Verhalten zu vermeiden.

**Mögliche Probleme & Risiken:**

*   **Race Conditions:** Wenn Module versuchen, auf Authentifizierungsdaten zuzugreifen, bevor `checkAuth` abgeschlossen ist. Die `async/await`-Struktur sollte dies verhindern.
*   **Fehler bei `checkAuth`:** Netzwerkprobleme oder Serverfehler beim Aufruf von `/api/auth/me` können die Initialisierung blockieren. Eine klare Fehlermeldung oder Umleitung ist wichtig.
*   **Unvollständige Bereinigung:** Verbleibende `localStorage`-Zugriffe für die alte Session-ID können zu Fehlern führen.
*   **Fehlende Imports/Referenzen:** Nach dem Refactoring könnten Modulimporte oder Funktionsreferenzen ungültig sein.

**Akzeptanzkriterien:**

*   `game.js` führt die `checkAuth()`-Prüfung erfolgreich *vor* der Spielinitialisierung durch und leitet bei fehlender Authentifizierung korrekt zum Login um.
*   Die alte Logik zum Lesen/Verwenden der `sessionId` aus `localStorage` ist vollständig entfernt.
*   Der Aufruf von `connectToServer` im `socketHandler` erfolgt ohne `sessionId`-Argument von `game.js`.
*   Die Logout-Funktionalität verwendet die neue `logout()`-Funktion aus der Auth-Logik, führt notwendige Aufräumarbeiten durch und leitet korrekt um.
*   Das Spiel initialisiert und funktioniert korrekt (Bewegung, Chat etc.) mit dem neuen Authentifizierungsfluss.