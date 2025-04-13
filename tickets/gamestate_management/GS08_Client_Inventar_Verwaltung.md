# Ticket GS08: Client Inventar-Verwaltung

**Ziel:**  
Implementierung der clientseitigen Logik zur Anzeige, Filterung, Sortierung und Nutzung von Items im Inventar des Spielers. Anbindung an die serverseitige `updateInventory`-Route (GS03).

---

## 1. Grundprinzipien & Zielsetzung

Das Inventar ist ein zentrales Spielelement, das dem Spieler ermöglicht, Items zu sammeln, zu verwenden, zu sortieren und zu verwalten. Die Client-Logik muss folgende Anforderungen erfüllen:

- **Synchronität mit dem Server:** Das Inventar auf dem Client muss immer den Zustand widerspiegeln, der auf dem Server gespeichert ist. Änderungen (z.B. Item verwenden, wegwerfen) werden über die API an den Server gemeldet und nach Bestätigung übernommen.
- **Reaktive UI:** Änderungen am Inventar (z.B. durch Server-Update, Item-Verbrauch) müssen sofort in der UI sichtbar werden.
- **Benutzerfreundlichkeit:** Die UI muss Filter- und Sortieroptionen bieten, um auch bei vielen Items Übersicht zu gewährleisten.
- **Erweiterbarkeit:** Die Architektur muss so gestaltet sein, dass neue Item-Typen und Aktionen (z.B. Kombinieren, Tauschen) leicht ergänzt werden können.

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
    - Implementiere die Klasse wie im vorherigen Abschnitt beschrieben.
    - Achte darauf, dass alle Methoden (`renderInventory`, `setupEventListeners`, `showItemOptions`, `useItem`, `discardItem`) sauber voneinander getrennt sind und jeweils nur eine Aufgabe erfüllen.
    - Die Methoden für Item-Aktionen sind zunächst Platzhalter und werden in späteren Tickets mit echter Spiellogik und API-Anbindung gefüllt.

2.  **HTML-Elemente hinzufügen (`client/game.html`):**
    - Stelle sicher, dass die IDs und Strukturen für das Inventar, die Filter und die Sortierung vorhanden sind.
    - Die UI sollte so gestaltet sein, dass sie auch bei vielen Items übersichtlich bleibt (z.B. durch Scrollbereiche, Gruppierung nach Typ).

3.  **Integration in `game.js` (`client/js/game.js`):**
    - Initialisiere den `InventoryManager` nach dem Laden des Spielstands.
    - Binde die Getter/Setter-Funktionen an das zentrale `gameState`.
    - Rufe `renderInventory` nach jedem Server-Update oder nach einer Aktion auf.

---

## 4. Akzeptanzkriterien

- Die Datei `client/js/inventory.js` existiert und enthält die `InventoryManager`-Klasse mit allen beschriebenen Methoden.
- Die HTML-Elemente für das Inventar, die Filter und die Sortierung sind in `game.html` vorhanden.
- Das Inventar wird beim Laden der Spielseite korrekt angezeigt und kann nach Name, Typ und Anzahl sortiert und gefiltert werden.
- Die Item-Aktionen sind als Platzhalter vorhanden und können in späteren Tickets mit echter Spiellogik gefüllt werden.
- Die UI ist reaktiv und zeigt Änderungen am Inventar sofort an.

---

## 5. Erweiterungsmöglichkeiten & Hinweise

- **Erweiterbarkeit:**  
  Die Architektur des `InventoryManager` ist so gestaltet, dass neue Item-Typen und Aktionen leicht ergänzt werden können. Neue Aktionen können als Methoden hinzugefügt und im Menü angezeigt werden.
- **Performance:**  
  Bei sehr großem Inventar kann das Rendern optimiert werden (z.B. durch Virtualisierung oder Pagination).
- **Barrierefreiheit:**  
  Die UI sollte so gestaltet sein, dass sie auch mit Tastatur und Screenreader bedienbar ist (z.B. durch semantische HTML-Elemente und ARIA-Attribute).
- **Testbarkeit:**  
  Die Methoden des `InventoryManager` sollten so geschrieben sein, dass sie leicht getestet werden können (z.B. durch Trennung von Logik und DOM-Manipulation).
