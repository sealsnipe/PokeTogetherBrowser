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

# Ticket GS06: Client SaveManager Implementierung

**Ziel:** Erstellung eines clientseitigen Moduls (`saveManager.js`) zur Verwaltung des Speicherprozesses, einschließlich manuellem Speichern, Markieren ungespeicherter Änderungen und Aktualisieren einer Speicheranzeige. Integration in die Haupt-Spiellogik (`game.js`).

**Hintergrund & Logik:**
Nachdem die serverseitigen Endpunkte zum Speichern der Grunddaten (`/api/save/save`) erstellt wurden (Ticket GS02), benötigen wir auf der Client-Seite eine Logik, die diesen Endpunkt aufruft. Ein `SaveManager` kapselt diese Funktionalität. Er sollte wissen, wann Änderungen aufgetreten sind (`unsavedChanges`), eine Methode zum manuellen Auslösen des Speicherns bereitstellen (`saveGame`) und optional eine UI-Anzeige (`saveIndicator`) über den Speicherstatus informieren. Die automatische Speicherung wird in einem späteren Ticket (GS10) hinzugefügt.

**Arbeitsschritte:**

1.  **`saveManager.js` erstellen (`client/js/saveManager.js`):**
    *   Erstelle eine neue Datei `client/js/saveManager.js`.
    *   Füge folgenden Code für die `SaveManager`-Klasse ein:
        ```javascript
        // client/js/saveManager.js

        class SaveManager {
          /**
           * Konstruktor für den SaveManager.
           * @param {object} options - Konfigurationsoptionen.
           * @param {function} options.getGameState - Funktion, die den aktuellen Spielzustand zurückgibt (nur relevante Teile für /api/save/save).
           * @param {string} [options.saveIndicatorId='saveIndicator'] - ID des HTML-Elements für die Speicheranzeige.
           * @param {string} [options.saveMessageId='saveMessage'] - ID des HTML-Elements für Speichernachrichten.
           */
          constructor({ getGameState, saveIndicatorId = 'saveIndicator', saveMessageId = 'saveMessage' }) {
            if (typeof getGameState !== 'function') {
              throw new Error("SaveManager benötigt eine 'getGameState'-Funktion.");
            }
            this.getGameState = getGameState;
            this.saveIndicatorElement = document.getElementById(saveIndicatorId);
            this.saveMessageElement = document.getElementById(saveMessageId);

            this.lastSaveTime = null; // Zeitstempel der letzten erfolgreichen Speicherung
            this.unsavedChanges = false; // Gibt es ungespeicherte Änderungen?
            this.isSaving = false; // Läuft gerade ein Speichervorgang?

            this.updateSaveIndicator(); // Initialen Zustand setzen
          }

          /**
           * Markiert, dass ungespeicherte Änderungen vorhanden sind.
           */
          markUnsavedChanges() {
            if (!this.unsavedChanges) {
              this.unsavedChanges = true;
              this.updateSaveIndicator();
              // console.log("Änderungen zum Speichern markiert."); // Optionales Debugging
            }
          }

          /**
           * Löst den Speichervorgang manuell aus.
           * @returns {Promise<boolean>} True bei Erfolg, false bei Fehler oder wenn gerade gespeichert wird.
           */
          async saveGame() {
            if (this.isSaving) {
              console.warn("Speichervorgang läuft bereits.");
              return false;
            }
            if (!this.unsavedChanges) {
              console.log("Keine ungespeicherten Änderungen zum Speichern.");
              return true; // Nichts zu tun
            }

            this.isSaving = true;
            this.showSaveMessage("Speichern..."); // Ladeanzeige

            try {
              // Aktuellen Spielzustand für die Grunddaten holen
              const currentState = this.getGameState();
              const saveData = {
                position: currentState.player ? { x: currentState.player.x, y: currentState.player.y } : undefined,
                isRunning: currentState.player ? currentState.player.isRunning : undefined,
                currentMap: currentState.currentMap,
                // playTimeIncrement wird hier nicht gesendet, Server berechnet das ggf. selbst oder es wird periodisch gesendet
              };

              // Filter undefined values
              Object.keys(saveData).forEach(key => saveData[key] === undefined && delete saveData[key]);
              if (saveData.position && (saveData.position.x === undefined || saveData.position.y === undefined)) {
                 delete saveData.position;
              }


              // API-Aufruf zum Speichern
              const response = await fetch('/api/save/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Wichtig für Cookie
                body: JSON.stringify(saveData)
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || `HTTP-Fehler ${response.status}`);
              }

              // Erfolg
              console.log('Spielstand erfolgreich gespeichert:', data);
              this.lastSaveTime = new Date(data.timestamp);
              this.unsavedChanges = false;
              this.updateSaveIndicator();
              this.showSaveMessage('Spielstand gespeichert!');
              this.isSaving = false;
              return true;

            } catch (error) {
              console.error('Fehler beim Speichern des Spielstands:', error);
              this.showSaveMessage(`Fehler: ${error.message}`, true);
              this.isSaving = false;
              return false;
            }
          }

          /**
           * Aktualisiert die Speicheranzeige (z.B. ein Icon).
           */
          updateSaveIndicator() {
            if (!this.saveIndicatorElement) return;

            if (this.isSaving) {
                 this.saveIndicatorElement.textContent = '💾...'; // Beispiel: Speichern läuft
                 this.saveIndicatorElement.title = 'Speichern läuft...';
                 this.saveIndicatorElement.classList.add('saving');
                 this.saveIndicatorElement.classList.remove('unsaved');
            } else if (this.unsavedChanges) {
              this.saveIndicatorElement.textContent = '💾*'; // Beispiel: Ungespeichert
              this.saveIndicatorElement.title = 'Ungespeicherte Änderungen vorhanden';
              this.saveIndicatorElement.classList.add('unsaved');
               this.saveIndicatorElement.classList.remove('saving');
            } else {
              this.saveIndicatorElement.textContent = '💾'; // Beispiel: Gespeichert
              this.saveIndicatorElement.title = `Gespeichert: ${this.lastSaveTime ? this.lastSaveTime.toLocaleTimeString() : 'Nie'}`;
              this.saveIndicatorElement.classList.remove('unsaved');
              this.saveIndicatorElement.classList.remove('saving');
            }
          }

          /**
           * Zeigt eine temporäre Nachricht zum Speicherstatus an.
           * @param {string} message - Die anzuzeigende Nachricht.
           * @param {boolean} [isError=false] - Ob es sich um eine Fehlermeldung handelt.
           */
          showSaveMessage(message, isError = false) {
            if (!this.saveMessageElement) return;

            this.saveMessageElement.textContent = message;
            this.saveMessageElement.className = isError ? 'save-message error' : 'save-message';
            this.saveMessageElement.style.opacity = '1';

            // Nachricht nach einiger Zeit ausblenden
            setTimeout(() => {
              if (this.saveMessageElement.textContent === message) { // Nur ausblenden, wenn sich die Nachricht nicht geändert hat
                 this.saveMessageElement.style.opacity = '0';
              }
            }, 3000);
          }
        }

        export default SaveManager;
        ```

2.  **HTML-Elemente hinzufügen (`client/game.html`):**
    *   Öffne die Datei `client/game.html`.
    *   Füge Elemente für die Speicheranzeige und Nachrichten hinzu, z.B. in der Kopfzeile oder einem Statusbereich:
        ```html
        <!-- Beispiel: In der .header > .user-info oder einem neuen Status-Div -->
        <span id="saveIndicator" title="Speicherstatus">💾</span>
        <span id="saveMessage" class="save-message"></span>
        <!-- Füge auch einen Speicher-Button hinzu, falls noch nicht vorhanden -->
        <button id="saveButton">Speichern</button>
        ```
    *   Füge grundlegendes CSS für `.save-message`, `.save-message.error`, `#saveIndicator.unsaved`, `#saveIndicator.saving` hinzu (z.B. in `client/css/game.css`).

3.  **Integration in `game.js` (`client/js/game.js`):**
    *   Öffne die Datei `client/js/game.js`.
    *   Importiere den `SaveManager`:
        ```javascript
        import SaveManager from './saveManager.js';
        ```
    *   Definiere eine Funktion, die den relevanten Spielzustand für `/api/save/save` zurückgibt:
        ```javascript
        // Funktion zum Abrufen des aktuellen Spielzustands für die Speicherung
        function getCurrentGameStateForSave() {
            // Annahme: 'players' enthält die Daten des eigenen Spielers unter 'myId'
            // Annahme: 'gameState' oder ähnliche Variablen halten den Zustand
            const myPlayer = players[getMyId()]; // getMyId() aus socketHandler importieren
            return {
                player: myPlayer ? { x: myPlayer.x, y: myPlayer.y, isRunning: myPlayer.isRunning } : undefined,
                currentMap: /* Variable für aktuelle Karte */ gameState.currentMap || 'default_map'
            };
        }
        ```
        *(Passe dies an deine tatsächliche Zustandsverwaltung an)*
    *   Initialisiere den `SaveManager` nach der Authentifizierung und UI-Initialisierung:
        ```javascript
        // Innerhalb des DOMContentLoaded-Listeners, nach initUIManager()
        const saveManager = new SaveManager({ getGameState: getCurrentGameStateForSave });
        ```
    *   Rufe `saveManager.markUnsavedChanges()` immer dann auf, wenn sich spielrelevante Daten ändern, die gespeichert werden sollen (z.B. Spielerbewegung, Kartenwechsel):
        ```javascript
        // Beispiel im 'move'-Handler (oder wo die Position aktualisiert wird)
        function handlePlayerMoved(id, data) {
            // ... Positionsupdate ...
            if (id === getMyId()) { // Nur eigene Änderungen markieren
                 saveManager.markUnsavedChanges();
            }
        }
        // Füge ähnliche Aufrufe hinzu, wenn sich currentMap, isRunning etc. ändern
        ```
    *   Binde den Speicher-Button an die `saveGame`-Methode:
        ```javascript
        // Innerhalb des DOMContentLoaded-Listeners
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                saveManager.saveGame();
            });
        }
        ```
    *   Optional: Implementiere das Speichern vor dem Verlassen der Seite:
        ```javascript
        window.addEventListener('beforeunload', (event) => {
          if (saveManager.unsavedChanges) {
            // Hinweis: Asynchrones Speichern hier ist nicht zuverlässig garantiert.
            // Besser ist regelmäßiges Auto-Save (Ticket GS10) oder explizites Speichern.
            // Man kann versuchen, synchron zu speichern, aber das blockiert den Browser.
            // saveManager.saveGame(); // Synchrone Variante wäre hier nötig, aber nicht empfohlen

            // Standard-Warnung anzeigen
            event.preventDefault();
            event.returnValue = 'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?';
          }
        });
        ```

**Akzeptanzkriterien:**

*   Die Datei `client/js/saveManager.js` existiert und enthält die `SaveManager`-Klasse mit den Methoden `saveGame`, `markUnsavedChanges`, `updateSaveIndicator`, `showSaveMessage`.
*   Die HTML-Elemente `#saveIndicator` und `#saveMessage` sind in `game.html` vorhanden.
*   Der `SaveManager` wird in `game.js` korrekt initialisiert.
*   `markUnsavedChanges()` wird bei relevanten Spieleraktionen aufgerufen.
*   Ein Klick auf den Speicher-Button (`#saveButton`) ruft `saveManager.saveGame()` auf, sendet einen POST-Request an `/api/save/save` und aktualisiert die UI-Anzeige.
*   Die Speicheranzeige (`#saveIndicator`) reflektiert den Zustand (gespeichert, ungespeichert, speichern...).
*   Speichernachrichten werden korrekt angezeigt und ausgeblendet.

**Wichtige Hinweise:**
*   Die `getGameState`-Funktion in `game.js` muss korrekt implementiert werden, um die Daten zu liefern, die der `saveGame`-Controller erwartet.
*   Das Speichern in `beforeunload` ist unzuverlässig für asynchrone Operationen wie `fetch`. Regelmäßiges automatisches Speichern (Ticket GS10) ist die robustere Lösung.
*   Das CSS für die Speicheranzeige und Nachrichten muss hinzugefügt werden, um die visuellen Zustände darzustellen.