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

# Ticket GS08: Client Inventar-Verwaltung

**Ziel:**  
Implementierung der clientseitigen Logik zur Anzeige, Filterung, Sortierung und Nutzung von Items im Inventar des Spielers. Anbindung an die serverseitige `updateInventory`-Route (GS03).

---

## 1. Grundprinzipien & Zielsetzung

Das Inventar ist ein zentrales Spielelement, das dem Spieler ermöglicht, Items zu sammeln, zu verwenden, zu sortieren und zu verwalten. Die Client-Logik muss folgende Anforderungen erfüllen:

- **Synchronität mit dem Server:** 
  Das Inventar auf dem Client muss immer den Zustand widerspiegeln, der auf dem Server gespeichert ist. Änderungen (z.B. Item verwenden, wegwerfen) werden über die API an den Server gemeldet und nach Bestätigung übernommen.
  *Warum:* Um Inkonsistenzen und Exploits zu vermeiden, muss der Client immer den validierten Zustand des Inventars vom Server beziehen.
- **Reaktive UI:** 
  Änderungen am Inventar (z.B. durch Server-Update, Item-Verbrauch) müssen sofort in der UI sichtbar werden.
  *Warum:* Der Spieler soll unmittelbares Feedback auf seine Aktionen erhalten.
- **Benutzerfreundlichkeit:** 
  Die UI muss Filter- und Sortieroptionen bieten, um auch bei vielen Items Übersicht zu gewährleisten.
  *Warum:* Ein unübersichtliches Inventar frustriert den Spieler.
- **Erweiterbarkeit:** 
  Die Architektur muss so gestaltet sein, dass neue Item-Typen und Aktionen (z.B. Kombinieren, Tauschen) leicht ergänzt werden können.
  *Warum:* Das Spiel soll in Zukunft um neue Items und Mechaniken erweiterbar sein, ohne den bestehenden Code grundlegend zu verändern.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. Datenfluss und Zustandsmanagement

- **Zentrale Datenquelle:**  
  Das Inventar wird im zentralen `gameState`-Objekt gehalten. Alle Module, die das Inventar anzeigen oder verändern, greifen auf dieses Objekt zu.  
  Vorteil: Es gibt eine einzige „Source of Truth“ für den aktuellen Zustand.

- **Getter/Setter-Prinzip:**  
  Der `InventoryManager` erhält beim Erstellen zwei Funktionen:  
  - `getInventory`: Gibt das aktuelle Inventar-Array zurück (z.B. aus `gameState.inventory`).
  - `setInventory`: Aktualisiert das Inventar im zentralen Zustand (z.B. nach einem Server-Update).

- **Reaktive Aktualisierung:**  
  Nach jeder Änderung (z.B. Item verwendet, entfernt, hinzugefügt) wird `setInventory` aufgerufen und anschließend `renderInventory`, um die UI zu aktualisieren.

### 2.2. UI-Rendering und Interaktion

- **Filterung:**  
  Die Items können nach Typ gefiltert werden (z.B. „Bälle“, „Medizin“, „Quest-Items“).  
  Die Filterung erfolgt clientseitig, indem das Inventar-Array nach dem ausgewählten Typ gefiltert wird.

- **Sortierung:**  
  Die Items können nach Name (A-Z/Z-A), Typ oder Anzahl sortiert werden.  
  Die Sortierung erfolgt ebenfalls clientseitig, indem das gefilterte Array sortiert wird.

- **Item-Optionen:**  
  Beim Klick auf ein Item werden mögliche Aktionen angezeigt (z.B. „Verwenden“, „Wegwerfen“, „Info“).  
  Die Aktionen werden als Menü oder Modal angezeigt und sind abhängig vom Item-Typ.

- **Aktionen auf Items:**  
  - **Verwenden:** Löst eine Aktion im Spiel aus (z.B. Heilung, Status-Effekt) und sendet ein Update an den Server.
  - **Wegwerfen:** Sendet ein Update an den Server, um das Item zu entfernen oder die Anzahl zu reduzieren.
  - **Geben/Lehren:** (Für Halte-Items oder TMs/HMs) Öffnet ggf. ein weiteres Menü zur Auswahl des Pokémon.

### 2.3. Server-Kommunikation

- **API-Aufruf:**  
  Jede Änderung am Inventar (z.B. Item verwenden, wegwerfen) wird über einen POST-Request an `/api/save/inventory` gemeldet.  
  Das Request-Body enthält ein Array von Änderungen, z.B.:
  ```json
  [
    { "itemId": 1, "quantity": 1, "action": "remove" },
    { "itemId": 2, "quantity": 3, "action": "add" }
  ]
  ```
- **Synchronisation:**  
  Nach erfolgreicher Antwort vom Server wird das Inventar im Client aktualisiert (`setInventory` mit den vom Server zurückgegebenen Daten).

- **Fehlerbehandlung:**  
  Bei Fehlern (z.B. Server nicht erreichbar, ungültige Aktion) wird eine Fehlermeldung in der UI angezeigt.

---

## 3. Arbeitsschritte

1.  **`InventoryManager` erstellen/anpassen (`client/js/inventory.js`):**
    *   Öffne die Datei `client/js/inventory.js` (oder erstelle sie, falls sie noch nicht existiert).
    *   Füge folgenden Code für die `InventoryManager`-Klasse ein:
        ```javascript
        // client/js/inventory.js

        class InventoryManager {
          /**
           * Konstruktor für den InventoryManager.
           * @param {object} options - Konfigurationsoptionen.
           * @param {function} options.getInventory - Funktion, die das aktuelle Inventar zurückgibt (Array von Items).
           * @param {function} options.setInventory - Funktion, um das Inventar zu aktualisieren (z.B. nach einer Aktion).
           * @param {string} [options.inventoryContainerId='inventoryItems'] - ID des HTML-Elements, das das Inventar enthält.
           * @param {string} [options.sortBySelectId='sortBy'] - ID des <select>-Elements für die Sortierung.
           * @param {string} [options.filterTypeSelectId='filterType'] - ID des <select>-Elements für die Filterung.
           */
          constructor({ getInventory, setInventory, inventoryContainerId = 'inventoryItems', sortBySelectId = 'sortBy', filterTypeSelectId = 'filterType' }) {
            if (typeof getInventory !== 'function' || typeof setInventory !== 'function') {
              throw new Error("InventoryManager benötigt 'getInventory' und 'setInventory' Funktionen.");
            }
            this.getInventory = getInventory;
            this.setInventory = setInventory;
            this.inventoryContainer = document.getElementById(inventoryContainerId);
            this.sortBySelect = document.getElementById(sortBySelectId);
            this.filterTypeSelect = document.getElementById(filterTypeSelectId);

            this.setupEventListeners(); // Event-Listener einrichten
            this.renderInventory(); // Initiales Rendern
          }

          /**
           * Richtet Event-Listener für Sortierung und Filterung ein.
           */
          setupEventListeners() {
            if (this.sortBySelect) {
              this.sortBySelect.addEventListener('change', () => {
                this.renderInventory();
              });
            }
            if (this.filterTypeSelect) {
              this.filterTypeSelect.addEventListener('change', () => {
                this.renderInventory();
              });
            }
          }

          /**
           * Rendert das Inventar im UI.
           */
          renderInventory() {
            if (!this.inventoryContainer) return;
            this.inventoryContainer.innerHTML = ''; // Container leeren

            const sortBy = this.sortBySelect ? this.sortBySelect.value : 'name-asc';
            const filterType = this.filterTypeSelect ? this.filterTypeSelect.value : 'all';

            let filteredItems = [...this.getInventory()]; // Kopie des Inventars
            // Filterung anwenden
            if (filterType !== 'all') {
              filteredItems = filteredItems.filter(item => item.type === filterType);
            }
            // Sortierung anwenden
            filteredItems.sort((a, b) => {
              switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'type': return a.type.localeCompare(b.type);
                case 'quantity-desc': return b.quantity - a.quantity;
                case 'quantity-asc': return a.quantity - b.quantity;
                default: return 0;
              }
            });

            if (filteredItems.length === 0) {
              this.inventoryContainer.innerHTML = '<div class="empty-inventory">Keine Items gefunden.</div>';
              return;
            }

            filteredItems.forEach(item => {
              const itemElement = document.createElement('div');
              itemElement.className = 'inventory-item';
              itemElement.dataset.id = item.id;
              itemElement.dataset.type = item.type;

              // Item-Icon (Beispiel)
              const iconElement = document.createElement('div');
              iconElement.className = 'item-icon';
              iconElement.textContent = item.icon || '?'; // Fallback, falls kein Icon vorhanden
              // Farbkodierung basierend auf dem Typ (Beispiel)
              switch (item.type) {
                case 'ball': iconElement.style.backgroundColor = '#e53935'; break;
                case 'medicine': iconElement.style.backgroundColor = '#43a047'; break;
                // ... weitere Typen ...
                default: iconElement.style.backgroundColor = '#757575';
              }

              const detailsElement = document.createElement('div');
              detailsElement.className = 'item-details';
              detailsElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-type">${this.getTypeLabel(item.type)}</div>
              `;

              const quantityElement = document.createElement('div');
              quantityElement.className = 'item-quantity';
              quantityElement.textContent = `x${item.quantity}`;

              itemElement.appendChild(iconElement);
              itemElement.appendChild(detailsElement);
              itemElement.appendChild(quantityElement);

              // Klick-Event (Optionen anzeigen)
              itemElement.addEventListener('click', () => this.showItemOptions(item));

              this.inventoryContainer.appendChild(itemElement);
            });
          }

          /**
           * Hilfsfunktion: Typ-Label abrufen (für bessere Lesbarkeit).
           */
          getTypeLabel(type) {
            switch (type) {
              case 'ball': return 'Ball';
              case 'medicine': return 'Erste Hilfe';
              // ... weitere Typen ...
              default: return type;
            }
          }

          /**
           * Zeigt die Optionen für ein Item an (Verwenden, Wegwerfen etc.).
           * @param {object} item - Das Item-Objekt.
           */
          showItemOptions(item) {
            // TODO: Implementiere die Anzeige von Optionen (z.B. über ein Modal)
            // und die Logik für die verschiedenen Aktionen (verwenden, wegwerfen, geben etc.).
            // Diese Aktionen müssen dann die updateInventory-Funktion auf dem Server aufrufen.
            console.log(`Optionen für Item ${item.name} anzeigen (Aktionen noch nicht implementiert).`);
          }

          /**
           * (Beispiel) Verwendet ein Item.
           * @param {object} item - Das Item-Objekt.
           */
          useItem(item) {
            // Implementierung je nach Item-Typ
            console.log(`Item ${item.name} verwenden`);
          }

          /**
           * (Beispiel) Wirft ein Item weg.
           * @param {object} item - Das Item-Objekt.
           */
          discardItem(item) {
            // Implementiere die Logik zum Wegwerfen des Items
            console.log(`Item ${item.name} wegwerfen (noch nicht implementiert).`);
          }
        }

        export default InventoryManager;
        ```

4.  **HTML-Elemente hinzufügen (`client/game.html`):**
    *   Öffne die Datei `client/game.html`.
    *   Stelle sicher, dass die notwendigen HTML-Elemente für das Inventar vorhanden sind:
        ```html
        <div id="inventory">
          <div class="inventory-header">
            <h2>Inventar</h2>
            <div class="filter-controls">
              <div class="filter-group">
                <label for="sortBy">Sortieren:</label>
                <select id="sortBy">
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="type">Typ</option>
                  <option value="quantity-desc">Anzahl (Hoch-Niedrig)</option>
                  <option value="quantity-asc">Anzahl (Niedrig-Hoch)</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="filterType">Typ:</label>
                <select id="filterType">
                  <option value="all">Alle</option>
                  <option value="ball">Bälle</option>
                  <option value="medicine">Erste Hilfe</option>
                  <option value="hold">Halte-Items</option>
                  <option value="quest">Quest</option>
                  <option value="tm">TM</option>
                  <option value="hm">VM</option>
                  <option value="berry">Beeren</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
            </div>
          </div>
          <div class="inventory-content" id="inventoryItems">
            <!-- Inventar-Items werden hier dynamisch eingefügt -->
          </div>
        </div>
        ```
    *   Stelle sicher, dass die IDs `inventoryItems`, `sortBy` und `filterType` korrekt sind.

5.  **Integration in `game.js` (`client/js/game.js`):**
    *   Öffne die Datei `client/js/game.js`.
    *   Importiere den `InventoryManager`:
        ```javascript
        import InventoryManager from './inventory.js';
        ```
    *   Definiere Funktionen zum Abrufen und Setzen des Inventars im `gameState`:
        ```javascript
        // Funktion zum Abrufen des Inventars aus dem GameState
        function getInventory() {
          return gameState.inventory;
        }

        // Funktion zum Setzen des Inventars im GameState
        function setInventory(newInventory) {
          gameState.inventory = newInventory;
        }
        ```
    *   Initialisiere den `InventoryManager` nach dem Laden des Spielstands:
        ```javascript
        // Innerhalb des DOMContentLoaded-Listeners, nach dem Laden des Spielstands
        const inventoryManager = new InventoryManager({
          getInventory: getInventory,
          setInventory: setInventory
        });
        ```
    *   Passe die `handleInit`-Funktion an, um das Inventar zu initialisieren:
        ```javascript
        function handleInit(serverPlayers) {
          // ... (Bisheriger Code) ...

          // Inventar initialisieren
          initInventory(initialGameData.inventory || []); // Übergebe geladenes Inventar
          gameState.inventory = initialGameData.inventory || []; // Inventar im GameState speichern
        }
        ```

**Akzeptanzkriterien:**

*   Die Datei `client/js/inventory.js` existiert und enthält die `InventoryManager`-Klasse mit den Methoden `renderInventory`, `setupEventListeners` und Hilfsfunktionen.
*   Die HTML-Elemente `#inventoryItems`, `#sortBy` und `#filterType` sind in `game.html` vorhanden.
*   Der `InventoryManager` wird in `game.js` korrekt initialisiert und mit den Funktionen `getInventory` und `setInventory` verbunden.
*   Das Inventar wird beim Laden der Spielseite korrekt angezeigt und kann nach Name, Typ und Anzahl sortiert und gefiltert werden.
*   Die Funktionen `useItem`, `giveItemToPokemon` und `discardItem` sind als Platzhalter vorhanden (die eigentliche Logik kommt in späteren Tickets).
*   Die UI ist reaktiv und zeigt Änderungen am Inventar sofort an.
