# Refactoring-Plan für client/game.html

**Ziele des Refactorings:**

1.  **Trennung der Belange (Separation of Concerns):** HTML, CSS und JavaScript strikt voneinander trennen.
2.  **Modularisierung:** Den JavaScript-Code in logische Module aufteilen (z.B. für Spieler, Chat, Inventar, Pokémon-Management, Rendering, Netzwerkkommunikation).
3.  **Daten-Auslagerung:** Statische Daten (wie Typ-Informationen, Beispiel-Pokémon/-Items) aus dem Code extrahieren.
4.  **Code-Bereinigung:** Redundanten Code entfernen (z.B. doppelte Funktionsdefinitionen, Event-Listener) und die allgemeine Codequalität verbessern.
5.  **Verbesserte Wartbarkeit & Lesbarkeit:** Den Code so strukturieren, dass er leichter zu verstehen und zu ändern ist.

**Vorgeschlagene neue Dateistruktur (innerhalb `client/`):**

```
client/
├── game.html               # (Bereinigtes HTML)
├── js/
│   ├── game.js             # (Haupt-Skript, Initialisierung)
│   ├── config.js           # (Konstanten, z.B. Geschwindigkeiten, Update-Intervalle)
│   ├── data/
│   │   ├── typeInfo.js     # (Typ-Icons, Schwächen)
│   │   └── exampleData.js  # (Beispiel-Inventar, Pokémon)
│   ├── modules/
│   │   ├── uiManager.js    # (DOM-Manipulation, Modal, Info-Panel, Listen-Updates)
│   │   ├── socketHandler.js# (Socket.IO-Verbindung und Event-Handling)
│   │   ├── player.js       # (Spieler-Logik, Bewegung, Steuerung)
│   │   ├── renderer.js     # (Canvas-Zeichnen, gameLoop)
│   │   ├── chat.js         # (Chat-Logik, Senden/Empfangen)
│   │   ├── inventory.js    # (Inventar-Logik, Rendern, Filtern/Sortieren)
│   │   └── pokemon.js      # (Pokémon-Team/Lager-Logik, Rendern, Drag&Drop, Interaktionen)
│   └── utils.js            # (Hilfsfunktionen, z.B. getTypeLabel, getTypeIcon)
├── css/
│   └── game.css            # (Alle CSS-Stile)
├── login.html
├── index.html
└── ... (andere bestehende Dateien)
```

**Detaillierte Liste der JavaScript-Funktionen und Variablen zur Auslagerung:**

| Element (Zeilen ca.)        | Beschreibung                                                                 | Vorgeschlagene Auslagerung                                                                                                |
| :-------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Globale Variablen**       |                                                                              |                                                                                                                           |
| `sessionId`, `username`     | Session-Daten aus localStorage                                               | In `game.js` oder `socketHandler.js` (wo sie primär gebraucht werden)                                                     |
| `socket`                    | Socket.IO-Instanz                                                            | In `socketHandler.js` (als exportierte Instanz oder innerhalb einer Klasse)                                               |
| `canvas`, `ctx`             | Canvas-Element und 2D-Kontext                                                | In `renderer.js` (als interne Variablen oder Teil einer Renderer-Klasse)                                                  |
| `players`, `myId`           | Spielzustandsdaten (Spielerpositionen, eigene ID)                            | In `game.js` (als globaler Zustand) oder `player.js` (als Teil eines Player-Management-Moduls)                             |
| `isRunning`, `baseSpeed`, `runningSpeed`, `keys`, `lastUpdateTime`, `networkUpdateInterval`, `lastNetworkUpdate` | Spielerbewegungs- und Steuerungsstatus                                       | `isRunning`, `keys`, `lastUpdateTime`, `lastNetworkUpdate` in `player.js`; `baseSpeed`, `runningSpeed`, `networkUpdateInterval` in `js/config.js` |
| `dirtPatches`, `grassBlades` | Statische Daten für Hintergrundelemente                                      | Evtl. in `renderer.js` oder eine separate `mapData.js` Datei                                                              |
| `inventoryItems` (Beispiel) | Beispiel-Inventardaten                                                       | In `js/data/exampleData.js`                                                                                               |
| `typeIcons`, `typeWeaknesses` | Pokémon-Typ-Informationen                                                    | In `js/data/typeInfo.js`                                                                                                  |
| `pokemonTeam`, `pokemonStorage` (Beispiel) | Beispiel-Pokémon-Daten                                                     | In `js/data/exampleData.js`                                                                                               |
| **Socket.IO Handler**       |                                                                              | In `socketHandler.js` (als Methoden einer Klasse oder exportierte Funktionen)                                             |
| `socket.on('connect_error')` | Fehlerbehandlung bei Verbindungsaufbau                                       | `socketHandler.js`                                                                                                        |
| `socket.on('init')`         | Initialen Spielzustand empfangen                                             | `socketHandler.js` (aktualisiert globalen Zustand oder ruft Funktion in `player.js`/`uiManager.js` auf)                   |
| `socket.on('player-joined')`| Neuen Spieler hinzufügen                                                     | `socketHandler.js` (aktualisiert globalen Zustand oder ruft Funktion in `player.js`/`uiManager.js` auf)                   |
| `socket.on('player-moved')` | Spielerposition aktualisieren                                                | `socketHandler.js` (aktualisiert globalen Zustand oder ruft Funktion in `player.js` auf)                                  |
| `socket.on('player-left')`  | Spieler entfernen                                                            | `socketHandler.js` (aktualisiert globalen Zustand oder ruft Funktion in `player.js`/`uiManager.js` auf)                   |
| `socket.on('chat-message')` | Chat-Nachricht empfangen                                                     | `socketHandler.js` (ruft Funktion in `chat.js` auf)                                                                       |
| **Spieler & Steuerung**     |                                                                              | In `player.js`                                                                                                            |
| `keydown` Event Listener    | Tastenstatus setzen (Bewegung, Rennen)                                       | `player.js` (oder `game.js` für die Initialisierung des Listeners)                                                        |
| `keyup` Event Listener      | Tastenstatus zurücksetzen                                                    | `player.js` (oder `game.js`)                                                                                              |
| `blur` Event Listener       | Tastenstatus bei Fokusverlust zurücksetzen                                   | `player.js` (oder `game.js`)                                                                                              |
| `updatePlayerPosition()`    | Spielerposition basierend auf Tasten und Zeit berechnen, Server-Update senden | `player.js`                                                                                                               |
| **Rendering**               |                                                                              | In `renderer.js`                                                                                                          |
| `gameLoop()`                | Haupt-Spielschleife: `updatePlayerPosition` aufrufen, Canvas zeichnen        | `renderer.js`                                                                                                             |
| Zeichnen (Hintergrund, Flecken, Gras, Spieler, Namen, Renn-Effekt) | Innerhalb von `gameLoop()`                                                 | `renderer.js` (evtl. aufgeteilt in Hilfsfunktionen wie `drawBackground`, `drawPlayers` etc.)                              |
| **UI & Interaktion**        |                                                                              | Aufgeteilt auf `uiManager.js`, `chat.js`, `inventory.js`, `pokemon.js`                                                    |
| `sendMessage()`             | Chat-Nachricht an Server senden                                              | `chat.js`                                                                                                                 |
| Chat Event Listeners        | Senden-Button, Enter-Taste                                                   | `chat.js` (oder `game.js` für Initialisierung)                                                                            |
| `updatePlayersList()`       | Spielerliste im UI aktualisieren                                             | `uiManager.js`                                                                                                            |
| Logout Event Listener       | Logout-Button-Klick, Fetch-Aufruf                                            | `uiManager.js` (oder `game.js` für Initialisierung), evtl. eine `auth.js` für API-Calls                                   |
| `loadSettings()`            | Gespeicherte Einstellungen laden                                             | `uiManager.js` (oder `game.js`)                                                                                           |
| `applyResolution()`         | Auflösung anwenden (Canvas, UI-Elemente)                                     | `uiManager.js` (oder `renderer.js` für Canvas-Teil)                                                                       |
| Modal Event Listeners       | Öffnen/Schließen des Einstellungs-Modals, Speichern                          | `uiManager.js` (oder `game.js` für Initialisierung)                                                                       |
| `renderInventory()`         | Inventar-Liste im UI rendern                                                 | `inventory.js`                                                                                                            |
| `filterAndSortInventory()`  | Inventar filtern und sortieren, `renderInventory` aufrufen                   | `inventory.js`                                                                                                            |
| `getTypeLabel()`            | Text-Label für Item-Typen                                                    | `utils.js`                                                                                                                |
| Inventar Event Listeners    | Filter/Sortierung Selects, Item-Klick                                        | `inventory.js` (oder `game.js` für Initialisierung)                                                                       |
| Tab-Wechsel Listeners       | Umschalten zwischen Pokémon-Team und Lager                                   | `pokemon.js` (oder `uiManager.js`, `game.js` für Initialisierung)                                                         |
| `renderPokemonTeam()`       | Pokémon-Team-Liste im UI rendern (inkl. HP-Bar, Menü)                        | `pokemon.js`                                                                                                              |
| `renderPokemonStorage()`    | Pokémon-Lager-Liste im UI rendern (inkl. HP-Bar, Menü)                       | `pokemon.js`                                                                                                              |
| `adjustPokemonTeam()`       | Höhe des Team-Bereichs an Canvas anpassen                                    | `uiManager.js` (oder `pokemon.js`)                                                                                        |
| Drag & Drop Listeners       | Pokémon im Team neu anordnen                                                 | `pokemon.js` (oder `game.js` für Initialisierung)                                                                         |
| Menü-Klick Listener (Team/Lager) | "INFO", "GEBEN", "INS TEAM" Aktionen                                       | `pokemon.js` (oder `game.js` für Initialisierung)                                                                         |
| `createGiveOption()`        | Erstellt "GEBEN"-Menüoption (verschiebt Pokémon ins Lager)                   | `pokemon.js`                                                                                                              |
| `createInfoOption()`        | Erstellt "INFO"-Menüoption (ruft `showPokemonInfo` auf)                      | `pokemon.js`                                                                                                              |
| `showPokemonInfo()`         | Füllt das Pokémon-Info-Panel mit Daten                                       | `pokemon.js` (oder `uiManager.js`)                                                                                        |
| Info-Panel Close Listener   | Schließt das Info-Panel                                                      | `pokemon.js` (oder `uiManager.js`, `game.js` für Initialisierung)                                                         |
| `getTypeIcon()`             | Icon für Pokémon-Typen (inkl. Dual-Typ)                                      | `utils.js`                                                                                                                |
| **Initialisierung**         |                                                                              | In `game.js`                                                                                                              |
| `DOMContentLoaded` Listener | Haupt-Initialisierungsblock: Canvas holen, Rendern, Listener registrieren, Loop starten | `game.js` (ruft Initialisierungsfunktionen aus anderen Modulen auf)                                                       |

**CSS-Auslagerung:**

1.  Den gesamten Inhalt des `<style>`-Tags (Zeilen 6-742) in die neue Datei `client/css/game.css` kopieren.
2.  Das `<style>`-Tag aus `client/game.html` entfernen.
3.  Im `<head>` von `client/game.html` einen Link zur CSS-Datei hinzufügen:
    `<link rel="stylesheet" href="css/game.css">`

**HTML-Bereinigung:**

1.  Das `<style>`-Tag entfernen (siehe CSS-Auslagerung).
2.  Das gesamte `<script>`-Tag (Zeilen 894-2567) entfernen.
3.  Am Ende des `<body>`-Tags in `client/game.html` die neuen JavaScript-Dateien einbinden (in der richtigen Reihenfolge, z.B. erst Konfiguration/Daten/Utils, dann Module, dann `game.js`):
    ```html
    <script src="js/config.js"></script>
    <script src="js/data/typeInfo.js"></script>
    <script src="js/data/exampleData.js"></script> <!-- Nur wenn benötigt -->
    <script src="js/utils.js"></script>
    <script src="js/modules/socketHandler.js"></script>
    <script src="js/modules/uiManager.js"></script>
    <script src="js/modules/player.js"></script>
    <script src="js/modules/renderer.js"></script>
    <script src="js/modules/chat.js"></script>
    <script src="js/modules/inventory.js"></script>
    <script src="js/modules/pokemon.js"></script>
    <script src="js/game.js" type="module"></script> <!-- type="module" für ES6 Module -->