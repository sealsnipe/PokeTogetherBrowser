## Einführung für neue Bearbeiter

Dieses Ticket befasst sich mit der Erweiterung und Erstellung von Datenmodellen für die Spielstand-Speicherung im PokeTogetherBrowser-Projekt. Das Projekt verwendet Node.js, Express, Sequelize (ORM) und eine relationale Datenbank (wahrscheinlich PostgreSQL oder MySQL).

**Wichtige Konzepte:**

*   **Sequelize:** Ein ORM (Object-Relational Mapper), der die Interaktion mit der Datenbank vereinfacht. Modelle definieren Tabellen und Beziehungen.
*   **Datenbank-Migrationen:** Änderungen an der Datenbankstruktur sollten idealerweise über Migrationen erfolgen, um die Konsistenz zu gewährleisten.
*   **Spielstand-Speicherung:** Die persistente Speicherung des Spielerfortschritts ist entscheidend für ein ansprechendes Spielerlebnis.

**Relevante Technologien:**

*   JavaScript (ES6+)
*   Node.js
*   Express
*   Sequelize
*   PostgreSQL oder MySQL
## Anweisungen für Deep Research

Dieses Kapitel richtet sich an Bearbeiter, die das Ticket durch umfassende Recherche weiter ausführen sollen. Ziel ist es, alle notwendigen Informationen zu sammeln und zu dokumentieren, um das Ticket allumfassend zu gestalten.

**Wichtige Aspekte:**

*   **Vollständigkeit:** Stelle sicher, dass alle relevanten Informationen zum Thema recherchiert und dokumentiert werden.
*   **Genauigkeit:** Überprüfe die recherchierten Informationen auf ihre Richtigkeit und Glaubwürdigkeit.
*   **Bezüge:** Dokumentiere alle Bezüge zu anderen Tickets, Modulen, Klassen oder Funktionen im Projekt.
*   **Kontext:** Stelle sicher, dass der Kontext der recherchierten Informationen klar und verständlich ist.
*   **Programmiersprache:** Beachte die spezifischen Grundkonstrukte und Besonderheiten von JavaScript (ES6+) und Node.js.
*   **Sequelize:** Recherchiere spezifische Sequelize-Funktionen und -Methoden, die im Ticket verwendet werden.
*   **Datenbank:** Recherchiere datenbankspezifische Konzepte (z.B. Indizes, Transaktionen, Normalisierung), die für die Spielstand-Speicherung relevant sind.

**Zu dokumentierende Informationen:**

*   **Datenmodelle:** Beschreibe die Struktur der Datenmodelle (Tabellen, Spalten, Datentypen) und ihre Beziehungen zueinander.
*   **Funktionen:** Dokumentiere die Funktionsweise der relevanten Funktionen und Methoden.
*   **Klassen:** Beschreibe die Struktur und das Verhalten der relevanten Klassen.
*   **Module:** Erkläre die Rolle und den Zweck der relevanten Module.
*   **Konfiguration:** Dokumentiere alle relevanten Konfigurationseinstellungen.
*   **Abhängigkeiten:** Liste alle Abhängigkeiten zu anderen Modulen, Klassen oder Funktionen auf.
*   **Beispiele:** Füge Codebeispiele hinzu, um die Verwendung der recherchierten Konzepte zu veranschaulichen.
*   **Ressourcen:** Verlinke auf externe Ressourcen (z.B. Dokumentationen, Tutorials, Blog-Artikel), die für das Thema relevant sind.

**Grundkonstrukte der Programmiersprache (JavaScript/Node.js):**

*   **Asynchrone Programmierung:** Verstehe die Konzepte von Promises, async/await und Callbacks.
*   **Module:** Recherchiere, wie Module in Node.js verwendet werden (require, module.exports).
*   **ES6+ Features:** Beachte moderne JavaScript-Features wie arrow functions, classes, destructuring und spread operator.



**Ziel:**

Das Ziel dieser Recherche ist es, ein umfassendes Verständnis des Themas zu erlangen und alle notwendigen Informationen zu dokumentieren, um das Ticket allumfassend zu gestalten und zukünftigen Bearbeitern die Arbeit zu erleichtern.

---


---

# Ticket GS07: Client Spielstand Laden & Initialisierung

**Ziel:** Anpassung der Haupt-Spiellogik (`game.js`), um beim Start (nach erfolgreicher Authentifizierung) den vollständigen Spielstand vom Server über die `/api/save/load`-Route abzurufen und die verschiedenen Spielmodule (Inventar, Pokémon, UI, Spielerposition etc.) mit diesen Daten zu initialisieren.

**Hintergrund & Logik:**
Nachdem der Benutzer authentifiziert ist (via `checkAuth`), muss der Client den aktuellen Spielstand vom Server laden, um das Spiel dort fortzusetzen, wo der Spieler aufgehört hat. Bisher wurde in `game.js` nur die Authentifizierung geprüft, aber noch kein Spielstand geladen. Wir erweitern die Initialisierungssequenz in `game.js`, um einen GET-Request an `/api/save/load` zu senden. Die zurückgegebenen Daten (Spielerdaten, Inventar, Pokémon, Fortschritt, Errungenschaften – wie in den Tickets GS02-GS05 definiert) werden dann verwendet, um den initialen `gameState` zu setzen und die entsprechenden Module (z.B. `InventoryManager`, `PokemonManager`, `UIManager`, `Player`) zu initialisieren.

**Arbeitsschritte:**

1.  **`loadGameData`-Funktion erstellen (z.B. in `authService.js` oder `game.js`):**
    *   Es empfiehlt sich, den API-Aufruf in einer eigenen Funktion zu kapseln. Diese kann in `authService.js` oder direkt in `game.js` platziert werden.
    *   Implementiere eine `async`-Funktion, die `/api/save/load` aufruft:
        ```javascript
        // Beispiel: In authService.js oder einer neuen apiService.js
        // const API_BASE_URL_SAVE = '/api/save'; // Ggf. separate Basis-URL

        export async function loadGameData() {
          try {
            console.log("[GAME DEBUG] loadGameData: Sending request to /api/save/load");
            const response = await fetch(`/api/save/load`, { // Sicherstellen, dass der Pfad korrekt ist
              method: 'GET',
              credentials: 'include', // Wichtig für Cookie
            });
            console.log(`[GAME DEBUG] loadGameData: Received response status: ${response.status}`);

            if (!response.ok) {
              const errorData = await response.text(); // Text lesen, falls kein JSON
              throw new Error(`Spielstand konnte nicht geladen werden: Status ${response.status} - ${errorData}`);
            }

            const gameData = await response.json();
            console.log("[GAME DEBUG] loadGameData: Received game data:", gameData);
            return gameData; // Enthält { player: {...}, inventory: [...], pokemon: [...], ... }

          } catch (error) {
            console.error("[GAME DEBUG] loadGameData: Error loading game data:", error);
            throw error; // Fehler weiterwerfen, damit game.js reagieren kann
          }
        }
        ```
    *   Importiere diese Funktion in `game.js`.

2.  **Initialisierungssequenz in `game.js` anpassen:**
    *   Öffne die Datei `client/js/game.js`.
    *   Ändere den `DOMContentLoaded`-Listener, um `loadGameData` nach erfolgreichem `checkAuth` aufzurufen:
        ```javascript
        // Importiere loadGameData am Anfang von game.js
        import { checkAuth, logout as performLogout, loadGameData } from './authService.js'; // Pfad anpassen

        // ... andere Imports ...

        document.addEventListener('DOMContentLoaded', async () => {
            console.log('DOM fully loaded. Initializing game...');

            let currentUser = null;
            let initialGameData = null; // Variable für geladene Spieldaten

            // 1. Authentifizierung prüfen
            try {
                currentUser = await checkAuth();
                if (!currentUser) {
                    window.location.href = '/login.html'; return;
                }
                console.log("Authentifiziert als:", currentUser.username);

                // 2. Spielstand laden
                initialGameData = await loadGameData(); // NEU
                if (!initialGameData || !initialGameData.player) {
                   // Sollte nicht passieren, wenn loadGame erfolgreich war, aber sicher ist sicher
                   throw new Error("Ungültige Spieldaten vom Server empfangen.");
                }

            } catch (error) {
                console.error("Fehler bei Authentifizierung oder Laden des Spielstands:", error);
                // Optional: Spezifische Fehlermeldung anzeigen
                alert(`Fehler beim Starten des Spiels: ${error.message}. Du wirst zum Login weitergeleitet.`);
                // Wichtig: Logout aufrufen, um ggf. ungültiges Cookie zu löschen
                performLogout().catch(() => {}); // Fehler beim Logout ignorieren, Redirect passiert sowieso
                return; // Verhindere weitere Initialisierung
            }

            // --- Ab hier nur fortfahren, wenn Auth & Laden erfolgreich ---

            try {
                // 3. UI initialisieren und Username anzeigen (aus geladenen Daten!)
                initUIManager();
                updateUsername(initialGameData.player.username); // Verwende Namen aus geladenen Daten

                // 4. Module initialisieren (Canvas, Controls, Chat etc.)
                const canvasElement = document.getElementById('gameCanvas');
                // ... (Restliche Modul-Initialisierungen wie gehabt) ...
                initPlayerControls(canvasElement);
                initChat();
                // ...

                // 5. Module mit geladenen Daten initialisieren/aktualisieren
                // Spielerposition & Zustand (für Player-Modul und Renderer)
                // Erstelle ein initiales 'players'-Objekt nur mit dem eigenen Spieler
                const myId = initialGameData.player.id; // Annahme: Server sendet Spieler-ID
                players = {
                    [myId]: { // Verwende die echte Spieler-ID als Schlüssel
                        x: initialGameData.player.position.x,
                        y: initialGameData.player.position.y,
                        username: initialGameData.player.username,
                        isRunning: initialGameData.player.isRunning
                        // Weitere Daten wie Farbe etc. könnten hier fehlen und später vom Server kommen
                    }
                };
                setPlayerModulePlayers(players);
                setPlayerModuleMyId(myId); // Eigene ID setzen
                setRendererPlayers(players);
                setRendererMyId(myId); // Eigene ID setzen

                // Inventar initialisieren
                initInventory(initialGameData.inventory || []); // Übergebe geladenes Inventar

                // Pokémon initialisieren
                initPokemon(initialGameData.pokemon || []); // Übergebe geladene Pokémon

                // Fortschritt & Errungenschaften (optional, je nach Implementierung)
                // gameState.progress = initialGameData.progress || {};
                // gameState.achievements = initialGameData.achievements || [];

                // 6. Callbacks registrieren (wie gehabt)
                registerSocketCallbacks({ /* ... */ });
                registerUICallbacks({ /* ... */ });

                // 7. SaveManager initialisieren (jetzt mit geladenem lastSave)
                const saveManager = new SaveManager({ getGameState: getCurrentGameStateForSave });
                if (initialGameData.player.lastSave) {
                    saveManager.lastSaveTime = new Date(initialGameData.player.lastSave);
                    saveManager.updateSaveIndicator(); // Initialen Indikator setzen
                }
                 // Speicher-Button anbinden (wie in GS06)
                const saveButton = document.getElementById('saveButton');
                 if (saveButton) {
                     saveButton.addEventListener('click', () => saveManager.saveGame());
                 }
                 // markUnsavedChanges bei Bewegung etc. (wie in GS06)


                // 8. Verbindung zum Server herstellen (wie gehabt)
                connectToServer('http://localhost:3001');

                console.log("Game initialization sequence complete (authenticated & loaded).");
                // Rendering wird in handleInit gestartet, wenn Server-Bestätigung kommt

            } catch(initError) {
                 console.error("Fehler während der Spielinitialisierung nach Laden:", initError);
                 alert("Ein Fehler ist bei der Initialisierung des Spiels aufgetreten.");
                 performLogout().catch(() => {});
            }
        });

        // Funktion getCurrentGameStateForSave anpassen, um auf die geladenen Daten zuzugreifen
        function getCurrentGameStateForSave() {
            const myPlayer = players[getMyId()];
            return {
                player: myPlayer ? { x: myPlayer.x, y: myPlayer.y, isRunning: myPlayer.isRunning } : undefined,
                currentMap: /* Variable für aktuelle Karte */ gameState.currentMap || 'default_map'
            };
        }

        // Globale Variable gameState definieren (oder anpassen, falls schon vorhanden)
        let gameState = {
           player: null, // Wird durch geladene Daten ersetzt
           currentMap: 'default_map', // Wird durch geladene Daten ersetzt
           inventory: [],
           pokemon: [],
           progress: {},
           achievements: []
        };

        // Wichtig: Die handleInit-Funktion muss angepasst werden!
        // Sie sollte nicht mehr den initialen Spielerzustand setzen,
        // sondern nur noch die Daten anderer Spieler hinzufügen/aktualisieren.
        function handleInit(serverPlayers, ownId) {
            console.log("Socket connected. Received initial player list:", serverPlayers);
            // Eigene Daten sind bereits aus /api/save/load geladen.
            // Füge nur die Daten ANDERER Spieler hinzu oder aktualisiere sie.
            players = { ...serverPlayers }; // Überschreibe lokales 'players' mit Serverdaten
            // Stelle sicher, dass eigene Daten nicht überschrieben werden oder aktualisiere sie gezielt
            if (initialGameData && initialGameData.player) {
                 players[ownId] = { // Eigene ID verwenden
                     x: initialGameData.player.position.x,
                     y: initialGameData.player.position.y,
                     username: initialGameData.player.username,
                     isRunning: initialGameData.player.isRunning
                 };
            }


            // Informiere andere Module über den initialen Zustand
            setPlayerModulePlayers(players);
            // setPlayerModuleMyId(ownId); // Ist schon gesetzt
            setRendererPlayers(players);
            // setRendererMyId(ownId); // Ist schon gesetzt

            // Aktualisiere die Spielerliste in der UI
            updatePlayersList(players, ownId);

            // Starte die Rendering-Schleife
            startRendering();
            displayChatSystemMessage("Willkommen zurück auf der Multiplayer-Wiese!");
        }

        // ... (Rest von game.js: handlePlayerJoined, handlePlayerMoved etc. bleiben weitgehend gleich,
        //      müssen aber ggf. sicherstellen, dass sie mit der neuen 'players'-Struktur arbeiten)
        ```

**Akzeptanzkriterien:**

*   Die Funktion `loadGameData` (oder Äquivalent) existiert und ruft `/api/save/load` korrekt auf.
*   `game.js` ruft `loadGameData` nach erfolgreicher Authentifizierung auf.
*   Bei Fehlern während `checkAuth` oder `loadGameData` wird der Benutzer zum Login umgeleitet.
*   Die von `loadGameData` zurückgegebenen Daten werden verwendet, um den initialen Spielzustand (`gameState`, `players`-Objekt) zu setzen.
*   Die Module `InventoryManager`, `PokemonManager` (oder `initInventory`/`initPokemon`), `UIManager`, `Player` und `Renderer` werden mit den geladenen Daten korrekt initialisiert.
*   Die `handleInit`-Funktion (Socket.io `init`-Event) überschreibt nicht die geladenen Daten des eigenen Spielers, sondern integriert nur die Daten anderer Spieler.
*   Das Spiel startet mit dem zuletzt gespeicherten Zustand (Position, Inventar, Pokémon etc.).

**Wichtige Hinweise:**
*   Die Struktur des `gameData`-Objekts, das von `/api/save/load` zurückgegeben wird, muss exakt mit dem übereinstimmen, was der Client erwartet und verarbeitet.
*   Die `handleInit`-Funktion muss sorgfältig angepasst werden, um Konflikte zwischen den über `/api/save/load` geladenen Daten und den über Socket.io empfangenen Daten zu vermeiden. Der `/api/save/load`-Aufruf sollte die "Source of Truth" für den initialen Zustand des eigenen Spielers sein.
*   Die `getCurrentGameStateForSave`-Funktion muss möglicherweise angepasst werden, um auf die korrekten Zustandsvariablen zuzugreifen, nachdem diese mit den geladenen Daten initialisiert wurden.
*   Eine globale `gameState`-Variable (oder ein ähnliches Konzept) ist wahrscheinlich notwendig, um die geladenen Daten zu speichern und für Module wie `SaveManager` zugänglich zu machen.