# Dokumentation: Refactoring von client/game.html

Dieses Dokument beschreibt das Refactoring der ursprünglichen `client/game.html`-Datei in eine modularere Struktur mit getrennten HTML-, CSS- und JavaScript-Dateien.

**Ziele des Refactorings:**

*   Trennung von HTML, CSS und JavaScript.
*   Modularisierung des JavaScript-Codes.
*   Auslagerung von Konfigurationen und Daten.
*   Verbesserung der Wartbarkeit und Lesbarkeit.

---

## Geänderte Dateien

### 1. `client/game.html`

*   **Zweck:** Enthält nur noch die grundlegende HTML-Struktur des Spiels.
*   **Änderungen:**
    *   Das interne `<style>`-Tag wurde entfernt.
    *   Das interne `<script>`-Tag wurde entfernt.
    *   Ein Link zur externen CSS-Datei (`css/game.css`) wurde im `<head>` hinzugefügt.
    *   Mehrere `<script>`-Tags zum Laden der ausgelagerten JavaScript-Module wurden am Ende des `<body>` hinzugefügt.

### 2. `client/css/game.css` (Neu)

*   **Zweck:** Enthält alle CSS-Regeln, die zuvor im `<style>`-Tag von `game.html` definiert waren.
*   **Inhalt:** Umfasst Stile für Layout, Header, Spielbereich, Inventar, Pokémon-Team/Lager, Chat, Spielerliste, Modal-Fenster und diverse UI-Komponenten.

---

## Neue JavaScript-Dateien (`client/js/`)

### 1. `client/js/config.js`

*   **Zweck:** Enthält globale Konfigurationskonstanten für das Spielverhalten.
*   **Exporte:**
    *   `BASE_SPEED` (number): Grundgeschwindigkeit des Spielers.
    *   `RUNNING_SPEED` (number): Geschwindigkeit des Spielers beim Rennen.
    *   `NETWORK_UPDATE_INTERVAL` (number): Zeitintervall (ms) für das Senden von Positionsupdates an den Server.
    *   `MAX_TEAM_SIZE` (number): Maximale Anzahl Pokémon im Team.

### 2. `client/js/data/typeInfo.js`

*   **Zweck:** Enthält Daten und Logik bezüglich Pokémon-Typen.
*   **Exporte:**
    *   `typeIcons` (object): Mapping von Typ-Namen zu Emoji-Icons.
    *   `typeWeaknesses` (object): Mapping von Typ-Namen (inkl. Dual-Typen) zu ihren Schwächen (x2 und x4). Enthält Logik zur Berechnung der Dual-Typ-Schwächen aus den Basis-Schwächen.
*   **Kommentare:** Enthält einen `// TODO:` bezüglich eines besseren Icons für den Typ "Boden".

### 3. `client/js/data/exampleData.js`

*   **Zweck:** Enthält Beispiel-Daten für Inventar und Pokémon. Dient als Platzhalter, bis Daten vom Server geladen werden.
*   **Exporte:**
    *   `exampleInventoryItems` (Array<object>): Liste von Beispiel-Inventar-Items.
    *   `examplePokemonTeam` (Array<object>): Liste von Beispiel-Pokémon für das Team. Nutzt `getTypeIcon` aus `utils.js` zur Icon-Zuweisung.
    *   `examplePokemonStorage` (Array<object>): Liste von Beispiel-Pokémon für das Lager. Nutzt `getTypeIcon` aus `utils.js` zur Icon-Zuweisung.
*   **Kommentare:** Enthält Hinweise, dass diese Daten in einer echten Anwendung vom Server kommen sollten und dass Icons für Items evtl. angepasst/dynamisch generiert werden sollten. Enthält Korrekturen für Pokémon-Typen (Bisasam, Quaputzi).

### 4. `client/js/utils.js`

*   **Zweck:** Enthält allgemeine Hilfsfunktionen, die von mehreren Modulen verwendet werden.
*   **Exporte:**
    *   `getTypeLabel(type)`: Gibt ein lesbares Label für einen Item-Typ zurück.
    *   `getTypeIcon(type)`: Gibt das/die passende(n) Emoji-Icon(s) für einen Pokémon-Typ zurück (behandelt auch Dual-Typen).
    *   `getHpBarClass(currentHp, maxHp)`: Gibt die CSS-Klasse ('red', 'yellow', '') für die HP-Balkenfarbe zurück.
    *   `getPokemonIconColor(type)`: Gibt die Hintergrundfarbe (Hex-Code) für ein Pokémon-Icon basierend auf dem Primärtyp zurück. Enthält hinzugefügte Farben für Typen, die vorher keine spezifische Farbe hatten.
    *   `getItemIconColor(type)`: Gibt die Hintergrundfarbe (Hex-Code) für ein Item-Icon basierend auf dem Item-Typ zurück.

### 5. `client/js/modules/socketHandler.js`

*   **Zweck:** Verwaltet die Socket.IO-Verbindung, Authentifizierung und die Kommunikation mit dem Server. Kapselt die Socket.IO-Logik.
*   **Interne Logik:** Hält die `socket`-Instanz und `myId`. Nutzt ein Callback-System, um andere Module über Server-Events zu informieren. Behandelt Verbindungsaufbau, Fehler, Trennung und spezifische Spiel-Events (`init`, `player-joined`, `player-moved`, `player-left`, `chat-message`). Verhindert das Verarbeiten eigener `player-moved`-Events.
*   **Exporte:**
    *   `connectToServer(serverUrl, sessionId, username)`: Baut die Verbindung auf und initialisiert Event-Listener. Leitet bei fehlender Session zum Login um.
    *   `registerCallbacks(callbacks)`: Ermöglicht anderen Modulen, Callback-Funktionen für Server-Events zu registrieren.
    *   `emitMove(pos)`: Sendet die Spielerposition an den Server.
    *   `emitChatMessage(messageText)`: Sendet eine Chat-Nachricht an den Server.
    *   `getMyId()`: Gibt die eigene Socket-ID zurück.
    *   `isConnected()`: Gibt zurück, ob der Socket aktuell verbunden ist.
*   **Kommentare:** Enthält Hinweise zur Fehlerbehandlung, optionalen Features (Server-Benachrichtigung bei Bereitschaft, Reconnect) und zur Vermeidung der Verarbeitung eigener Bewegungsupdates.

### 6. `client/js/modules/uiManager.js`

*   **Zweck:** Verwaltet DOM-Manipulationen und UI-Updates (Spielerliste, Modals, Info-Panel, Statusanzeigen).
*   **Interne Logik:** Hält Referenzen auf viele DOM-Elemente. Initialisiert Event-Listener für UI-Interaktionen (Settings-Button, Modal-Schaltflächen, Logout-Button, Info-Panel-Schließen). Enthält Funktionen zum Anzeigen/Verstecken von Modal und Info-Panel. Lädt und wendet gespeicherte Einstellungen (Auflösung) an. Passt die Höhe von UI-Elementen an die Canvas-Größe an. Enthält Hilfsfunktionen zum Erstellen von Schwäche-Einträgen.
*   **Exporte:**
    *   `initUIManager()`: Initialisiert das Modul, holt DOM-Referenzen, setzt Listener.
    *   `registerCallbacks(callbacks)`: Registriert Callbacks für UI-Events (`onSaveSettings`, `onLogout`).
    *   `updateUsername(username)`: Aktualisiert den angezeigten Benutzernamen.
    *   `updateRunStatus(isRunning)`: Aktualisiert die Renn-Statusanzeige.
    *   `updatePlayersList(players, myId)`: Rendert die Spielerliste neu.
    *   `showOptionsModal()`: Zeigt das Einstellungs-Modal an.
    *   `hideOptionsModal()`: Versteckt das Einstellungs-Modal.
    *   `showPokemonInfoPanel(pokemon)`: Füllt und zeigt das Pokémon-Info-Panel an.
    *   `hidePokemonInfoPanel()`: Versteckt das Pokémon-Info-Panel.

### 7. `client/js/modules/player.js`

*   **Zweck:** Verwaltet den Zustand und die Steuerung des lokalen Spielers.
*   **Interne Logik:** Hält den lokalen Spielerstatus (`isRunning`, `keys`, Zeitstempel für Updates). Verarbeitet Tastatur-Events (`keydown`, `keyup`, `blur`) zur Aktualisierung des `keys`-Status und des `isRunning`-Flags. Berechnet die neue Spielerposition in `updatePlayerPosition` unter Berücksichtigung von `deltaTime`, Geschwindigkeit, Skalierung und Kollision mit Canvas-Grenzen. Sendet Positionsupdates ratenbasiert über `emitMove`. Aktualisiert die Renn-Status-UI.
*   **Exporte:**
    *   `initPlayerControls(canvasElement)`: Initialisiert die Event-Listener für die Steuerung.
    *   `setPlayers(serverPlayers)`: Setzt das globale Spielerobjekt.
    *   `setMyId(ownId)`: Setzt die eigene Socket-ID.
    *   `getMyPlayer()`: Gibt das Datenobjekt des lokalen Spielers zurück.
    *   `updatePlayerPosition(deltaTime)`: Berechnet die neue Position und sendet ggf. ein Update. Wird vom `renderer` (gameLoop) aufgerufen.
    *   `getIsRunning()`: Gibt den aktuellen Rennstatus zurück.
    *   `getKeysState()`: Gibt den aktuellen Tastenstatus zurück.
    *   `cleanupPlayerControls()`: Entfernt die Event-Listener.

### 8. `client/js/modules/renderer.js`

*   **Zweck:** Verantwortlich für das Zeichnen aller visuellen Elemente auf dem Canvas. Enthält die Haupt-Spielschleife (`gameLoop`).
*   **Interne Logik:** Hält Canvas-Referenz und 2D-Kontext. Enthält statische Daten für Kartenelemente (`dirtPatches`, `grassBlades`). Die `gameLoop` ruft `updatePlayerPosition` auf und zeichnet dann das Spiel mittels `drawGame`. `drawGame` ruft `drawBackground` und `drawPlayers` auf. Diese Funktionen zeichnen die entsprechenden Elemente unter Berücksichtigung der Canvas-Größe und Skalierungsfaktoren. `drawPlayers` zeichnet auch Namen und den Renn-Effekt.
*   **Exporte:**
    *   `initRenderer(canvasElement)`: Initialisiert den Renderer und holt den Kontext.
    *   `setPlayers(serverPlayers)`: Setzt das globale Spielerobjekt.
    *   `setMyId(ownId)`: Setzt die eigene Socket-ID.
    *   `startRendering()`: Startet die `requestAnimationFrame`-Schleife.
    *   `stopRendering()`: Stoppt die `requestAnimationFrame`-Schleife.
*   **Kommentare:** Enthält Hinweise, dass Kartenelemente auch aus Datenquellen geladen werden könnten. Enthält eine Warnung für ungültige Spielerdaten.

### 9. `client/js/modules/chat.js`

*   **Zweck:** Kapselt die Logik für die Chat-Funktionalität.
*   **Interne Logik:** Hält Referenzen auf Chat-UI-Elemente. Setzt Event-Listener für Senden-Button und Enter-Taste. `handleSendMessage` liest den Input, sendet die Nachricht über `emitChatMessage` und leert das Input-Feld. `displayMessage` erstellt die DOM-Elemente für eine Nachricht (unterscheidet eigene/fremde Nachrichten, fügt Sender und Zeitstempel hinzu) und hängt sie an den Container an. `scrollToBottom` sorgt dafür, dass die neueste Nachricht sichtbar ist. `displaySystemMessage` fügt formatierte Systemnachrichten hinzu.
*   **Exporte:**
    *   `initChat()`: Initialisiert das Modul und setzt Listener.
    *   `displayMessage(message)`: Zeigt eine empfangene Nachricht an.
    *   `displaySystemMessage(text)`: Zeigt eine Systemnachricht an.

### 10. `client/js/modules/inventory.js`

*   **Zweck:** Verwaltet die Anzeige und Interaktion mit dem Spieler-Inventar.
*   **Interne Logik:** Hält Referenzen auf Inventar-UI-Elemente und den aktuellen Inventarstatus (`currentInventory`). Initialisiert mit Beispieldaten. `filterAndSortInventory` filtert und sortiert `currentInventory` basierend auf den Select-Box-Werten und ruft `renderInventory` auf. `renderInventory` erstellt die DOM-Elemente für jedes Item (Icon mit Farbe, Details, Menge, Tooltip) und fügt Klick-Listener hinzu. `handleItemClick` ist eine Platzhalterfunktion für Item-Interaktionen.
*   **Exporte:**
    *   `initInventory()`: Initialisiert das Modul, lädt Daten, setzt Listener.
    *   `setInventory(items)`: Aktualisiert die Inventardaten und rendert neu.
*   **Kommentare:** Enthält einen `// TODO:` zur Implementierung der tatsächlichen Item-Nutzung.

### 11. `client/js/modules/pokemon.js`

*   **Zweck:** Verwaltet das Pokémon-Team und das Lager, inklusive UI-Darstellung und Interaktionen.
*   **Interne Logik:** Hält Referenzen auf UI-Elemente (Team/Lager-Container, Tabs) und den Zustand (`currentTeam`, `currentStorage`). Initialisiert mit Beispieldaten. Enthält Funktionen zum Wechseln der Ansicht (`switchToTeamView`, `switchToStorageView`). `renderPokemonTeam` und `renderPokemonStorage` erstellen die Pokémon-Slots mittels `createPokemonSlot`. `createPokemonSlot` erstellt das komplette DOM-Element für ein Pokémon (Icon, Details, HP-Balken, Menü). `createPokemonMenu` erstellt das Kontextmenü dynamisch basierend auf dem Kontext (Team/Lager). Enthält Logik für Drag & Drop im Team (`addDragDropListeners`). `movePokemonToStorage` und `movePokemonToTeam` behandeln das Verschieben von Pokémon zwischen Team und Lager und aktualisieren die UI. `closeAllPokemonMenus` schließt offene Menüs.
*   **Exporte:**
    *   `initPokemon()`: Initialisiert das Modul, lädt Daten, setzt Listener.
    *   `setTeam(teamData)`: Aktualisiert die Team-Daten und rendert neu.
    *   `setStorage(storageData)`: Aktualisiert die Lager-Daten und rendert ggf. neu.
*   **Kommentare:** Enthält `// TODO:` Hinweise zur Server-Kommunikation beim Verschieben von Pokémon und bei der Aktualisierung der Team-Reihenfolge.

### 12. `client/js/game.js`

*   **Zweck:** Haupt-Einstiegspunkt der Anwendung. Initialisiert alle Module in der korrekten Reihenfolge und verbindet sie über Callbacks. Startet die Spiel-Logik.
*   **Interne Logik:** Wartet auf `DOMContentLoaded`. Holt Session-Daten. Initialisiert UI, Renderer, Player-Steuerung, Chat, Inventar, Pokémon-Module. Registriert Callback-Funktionen bei `socketHandler` und `uiManager`, um auf Server-Events und UI-Aktionen zu reagieren (`handleInit`, `handlePlayerJoined`, etc.). Stellt die Verbindung zum Server her. Enthält die Callback-Handler, die den globalen Zustand (`players`) aktualisieren und Funktionen in anderen Modulen aufrufen (z.B. `updatePlayersList`, `displayChatMessage`). `handleInit` startet den Render-Loop. `handleLogout` und `forceLogout` kümmern sich um den Abmeldevorgang. Ein `beforeunload`-Listener sorgt für grundlegendes Aufräumen beim Schließen des Fensters.
*   **Exporte:** Keine (ist das Haupt-Skript).
*   **Kommentare:** Enthält `// TODO:` Hinweise zum Holen der Server-URL aus einer Konfiguration und zum Laden echter Spielerdaten (Inventar, Pokémon) vom Server nach der Initialisierung.

---