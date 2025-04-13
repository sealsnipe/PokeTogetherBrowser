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

# Ticket GS02: Basis-Speicher/Lade-Controller & Routen

**Ziel:** Implementierung der grundlegenden Server-Endpunkte zum Speichern und Laden der Spieler-Grunddaten (Position, Karte, Geld, Spielzeit etc.). Erstellung des `saveController.js` und der `saveRoutes.js`.

---

## 1. Grundprinzipien & Zielsetzung

Die Spielstand-Speicherung ist ein Kernfeature, das es Spielern ermöglicht, ihren Fortschritt zu sichern und später fortzusetzen. Dieses Ticket konzentriert sich auf die grundlegenden Aspekte:

- **Persistenz der Spielerdaten:** Die Position, aktuelle Karte, Geld, Spielzeit und der Zeitpunkt der letzten Speicherung müssen dauerhaft gespeichert werden.
- **API-basierter Zugriff:** Der Client soll über definierte API-Endpunkte auf die Speicher- und Ladefunktionen zugreifen.
- **Sicherheit:** Nur authentifizierte Benutzer sollen ihren Spielstand manipulieren können.
- **Fehlerbehandlung:** Der Server muss Fehler (z.B. ungültige Daten, Datenbankprobleme) abfangen und dem Client eine aussagekräftige Rückmeldung geben.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. `saveController.js` erstellen

- **Ziel:** Erstellung eines neuen Moduls, das die Logik für das Speichern und Laden des Spielstands kapselt.
- **Warum:** Ein dedizierter Controller sorgt für eine saubere Trennung der Verantwortlichkeiten (Separation of Concerns) und erleichtert die Wartung und Erweiterung des Codes. Indem wir die Datenbankzugriffe und die Geschäftslogik von den Routen-Handlern trennen, erhalten wir einen übersichtlicheren und besser testbaren Code.
- **Schritte:**
    1.  Erstelle eine neue Datei `server/controllers/saveController.js` im `server/controllers/`-Verzeichnis.
    2.  Importiere die notwendigen Module:
        ```javascript
        const db = require('../models'); // Für Datenbankzugriffe mit Sequelize
        ```
        - **Warum:** Wir benötigen das `db`-Objekt, das in `server/models/index.js` definiert wurde, um auf die Sequelize-Modelle (z.B. `Player`, `Progress`, `Achievement`) zuzugreifen und Datenbankabfragen durchzuführen.
    3.  Implementiere die `saveGame`-Funktion:
        - **Ziel:** Diese Funktion soll die grundlegenden Spielerdaten (Position, Karte, Laufstatus, Geld, Spielzeit) in der Datenbank speichern.
        - **Warum:** Dies ermöglicht es dem Spieler, seinen Fortschritt zu sichern und später fortzusetzen. Ohne diese Funktion wäre der Spielfortschritt nicht persistent.
        - **Details:**
            *   Die Funktion muss zunächst die Spieler-ID aus dem Request-Objekt extrahieren. Da wir die `authenticate`-Middleware verwenden, ist die ID im `req.player`-Objekt verfügbar (z.B. `req.player.id`).
            *   Anschließend werden die zu speichernden Daten (Position, Laufstatus, aktuelle Karte, Spielzeit) aus dem Request-Body extrahiert. Der Client sendet diese Daten als JSON im Body des POST-Requests.
            *   Die Funktion sucht den entsprechenden Spielerdatensatz in der Datenbank (mit `db.Player.findByPk(playerId)`). `findByPk` ist eine Sequelize-Methode, die einen Datensatz anhand seines Primärschlüssels (in diesem Fall die Spieler-ID) findet.
            *   Wenn der Spieler nicht gefunden wird, wird ein 404-Fehler zurückgegeben. Dies deutet darauf hin, dass die Spieler-ID ungültig ist oder der Spielerdatensatz aus der Datenbank gelöscht wurde.
            *   Die relevanten Felder des Spielerdatensatzes werden mit den neuen Werten aus dem Request aktualisiert. Es ist wichtig, nur die Felder zu aktualisieren, die tatsächlich im Request-Body vorhanden sind, um keine ungewollten Änderungen vorzunehmen.
            *   Der aktualisierte Spielerdatensatz wird in der Datenbank gespeichert (mit `player.save()`). `save()` ist eine Sequelize-Methode, die die Änderungen am Datensatz in die Datenbank schreibt.
            *   Ein Zeitstempel für die letzte Speicherung wird gesetzt (`player.last_save = new Date()`). Dies ermöglicht es, den Zeitpunkt der letzten Speicherung anzuzeigen oder für andere Zwecke zu verwenden (z.B. um automatische Speicherintervalle zu steuern).
            *   Schließlich wird eine Erfolgsantwort mit dem Zeitstempel zurückgegeben. Die Antwort enthält einen HTTP-Statuscode 200 (OK) und ein JSON-Objekt mit einer Erfolgsmeldung und dem Zeitstempel.
            *   Ein `try...catch`-Block fängt alle potenziellen Fehler ab (z.B. Datenbankverbindungsfehler, Validierungsfehler) und gibt einen 500-Fehler zurück. Dies ist wichtig, um unerwartete Fehler abzufangen und dem Client eine aussagekräftige Fehlermeldung zurückzugeben.
        *   **Code:**
        ```javascript
        // Spielstand speichern (nur Grunddaten)
        exports.saveGame = async (req, res) => {
          try {
            // Spieler-ID aus der Authentifizierungs-Middleware holen (req.player wurde in authenticate gesetzt)
            const playerId = req.player.id;
            // Daten aus dem Request-Body extrahieren
            const { position, isRunning, currentMap, playTimeIncrement } = req.body;

            // Spieler in der Datenbank suchen
            const player = await db.Player.findByPk(playerId);
            if (!player) {
              return res.status(404).json({ message: 'Spieler nicht gefunden' });
            }

            // Spieler-Grunddaten aktualisieren (nur wenn Werte übergeben wurden)
            if (position && typeof position.x === 'number' && typeof position.y === 'number') {
              player.position_x = position.x;
              player.position_y = position.y;
            }
            if (typeof isRunning === 'boolean') {
              player.is_running = isRunning;
            }
            if (typeof currentMap === 'string') {
              player.current_map = currentMap;
            }
            if (typeof playTimeIncrement === 'number' && playTimeIncrement > 0) {
              player.play_time += playTimeIncrement; // Spielzeit addieren
            }
            player.last_save = new Date(); // Zeitstempel für die letzte Speicherung setzen

            // Änderungen speichern
            await player.save();

            // Erfolgsantwort senden
            res.status(200).json({
              message: 'Spielstand (Grunddaten) erfolgreich gespeichert',
              timestamp: player.last_save
            });
          } catch (error) {
            console.error('Fehler beim Speichern des Spielstands:', error);
            res.status(500).json({ message: 'Serverfehler beim Speichern des Spielstands' });
          }
        };
        ```
    4.  Implementiere die `loadGame`-Funktion:
        *   **Ziel:** Diese Funktion soll die grundlegenden Spielerdaten aus der Datenbank abrufen und an den Client senden.
        *   **Warum:** Dies ermöglicht es dem Spieler, seinen zuletzt gespeicherten Zustand wiederherzustellen.
        *   **Details:**
            *   Die Funktion muss zunächst die Spieler-ID aus dem Request-Objekt extrahieren (wie bei `saveGame`).
            *   Anschließend wird der Spielerdatensatz aus der Datenbank geladen (mit `db.Player.findByPk(playerId)`).
            *   Wenn der Spieler nicht gefunden wird, wird ein 404-Fehler zurückgegeben.
            *   Ein neues Objekt (`gameData`) wird erstellt, das die relevanten Spielerdaten enthält (ID, Benutzername, Position, Laufstatus, aktuelle Karte, Geld, Spielzeit).
            *   Dieses Objekt wird als JSON-Antwort an den Client gesendet.
            *   Ein `try...catch`-Block fängt alle potenziellen Fehler ab und gibt einen 500-Fehler zurück.
        *   **Code:**
        ```javascript
        // Spielstand laden (nur Grunddaten)
        exports.loadGame = async (req, res) => {
          try {
            const playerId = req.player.id;

            // Spieler laden (ohne assoziierte Daten in diesem Schritt)
            const player = await db.Player.findByPk(playerId);
            if (!player) {
              return res.status(404).json({ message: 'Spieler nicht gefunden' });
            }

            // Nur relevante Grunddaten für den Client formatieren
            const gameData = {
              player: {
                id: player.id,
                username: player.username, // Wichtig für die UI
                position: {
                  x: player.position_x,
                  y: player.position_y
                },
                isRunning: player.is_running,
                currentMap: player.current_map,
                money: player.money,
                playTime: player.play_time,
                lastSave: player.last_save
                // Weitere Grunddaten nach Bedarf...
              }
              // Assoziierte Daten (Inventar, Pokemon etc.) werden in späteren Tickets hinzugefügt
            };

            res.status(200).json(gameData);
          } catch (error) {
            console.error('Fehler beim Laden des Spielstands:', error);
            res.status(500).json({ message: 'Serverfehler beim Laden des Spielstands' });
          }
        };
        ```

### 2.2. `saveRoutes.js` erstellen

- **Ziel:** Erstellung eines neuen Moduls, das die API-Endpunkte für das Speichern und Laden des Spielstands definiert.
- **Warum:** Ein dedizierter Router sorgt für eine saubere Organisation der API-Endpunkte und ermöglicht eine einfache Erweiterung um weitere Funktionen.
- **Schritte:**
    1.  Erstelle eine neue Datei `server/routes/saveRoutes.js`.
    2.  Importiere die notwendigen Module:
        ```javascript
        const express = require('express');
        const router = express.Router();
        const saveController = require('../controllers/saveController');
        const { authenticate } = require('../middleware/authMiddleware'); // Wichtig!
        ```
        - **Warum:**
            - `express`: Für die Erstellung des Routers.
            - `router`: Die Express-Router-Instanz.
            - `saveController`: Der Controller, der die eigentliche Logik enthält.
            - `authenticate`: Die Middleware, die sicherstellt, dass nur authentifizierte Benutzer auf die Routen zugreifen können.
    3.  Definiere die Routen:
        ```javascript
        // Alle Routen in dieser Datei erfordern Authentifizierung
        router.use(authenticate);

        // Spielstand speichern (Grunddaten)
        // POST /api/save/save
        router.post('/save', saveController.saveGame);

        // Spielstand laden (Grunddaten)
        // GET /api/save/load
        router.get('/load', saveController.loadGame);

        // Weitere Routen (Inventar, Pokemon etc.) werden in späteren Tickets hinzugefügt

        module.exports = router;
        ```
        - `router.use(authenticate)`: Wendet die `authenticate`-Middleware auf alle Routen in diesem Router an. Das bedeutet, dass *jede* Anfrage an diese Routen zuerst die Authentifizierung passieren muss.
        - `router.post('/save', saveController.saveGame)`: Definiert einen POST-Endpunkt unter `/api/save/save`, der die `saveGame`-Funktion im `saveController` aufruft.
        - `router.get('/load', saveController.loadGame)`: Definiert einen GET-Endpunkt unter `/api/save/load`, der die `loadGame`-Funktion im `saveController` aufruft.

### 2.3. Routen in Server integrieren

- **Ziel:** Die neuen Routen in die Hauptanwendung (`server/index.js`) einbinden, damit sie erreichbar sind.
- **Warum:** Damit die Routen funktionieren, müssen sie in die Express-Anwendung eingebunden werden.
- **Schritte:**
    1.  Öffne die Datei `server/index.js`.
    2.  Importiere die neuen Routen:
        ```javascript
        const saveRoutes = require('./routes/saveRoutes');
        ```
    3.  Binde die Routen unter dem Präfix `/api/save` ein (nach den Auth-Routen):
        ```javascript
        // API Routen Definition
        webApp.use('/api/auth', authRoutes);
        webApp.use('/api/save', saveRoutes); // NEU
        // webApp.use('/api/game', authenticate, gameRoutes); // Beispiel für andere geschützte Routen
        ```
        - `webApp.use('/api/save', saveRoutes)`: Dies bindet alle Routen, die in `saveRoutes` definiert sind, unter dem Pfad `/api/save` in die Express-Anwendung ein. Das bedeutet, dass z.B. die `saveGame`-Funktion über `POST /api/save/save` erreichbar ist.

---

## 3. Akzeptanzkriterien

*   Die Datei `server/controllers/saveController.js` existiert und enthält die Funktionen `saveGame` und `loadGame`.
*   Die Datei `server/routes/saveRoutes.js` existiert und definiert die Routen `POST /api/save/save` und `GET /api/save/load`, die die entsprechenden Controller-Funktionen aufrufen und die `authenticate`-Middleware verwenden.
*   Die `saveRoutes` sind korrekt in `server/index.js` eingebunden.
*   Ein authentifizierter POST-Request an `/api/save/save` mit Daten im Body (z.B. `{ "position": { "x": 100, "y": 150 }, "isRunning": true }`) aktualisiert die entsprechenden Felder des Spielers in der Datenbank und gibt eine Erfolgsantwort zurück.
*   Ein authentifizierter GET-Request an `/api/save/load` gibt die Grunddaten des Spielers im erwarteten JSON-Format zurück.
*   Nicht authentifizierte Requests an diese Endpunkte werden mit Status 401 abgewiesen.
*   Der Server startet ohne Fehler bezüglich des neuen Controllers oder der Routen.

---

## 4. Wichtige Hinweise

*   Die `authenticate`-Middleware ist entscheidend, um sicherzustellen, dass nur eingeloggte Spieler ihren Spielstand speichern/laden können. Sie stellt die Spieler-ID über `req.player.id` bereit.
*   Die `saveGame`-Funktion sollte robust sein und nur die Felder aktualisieren, die tatsächlich im Request-Body übergeben werden. Dies vermeidet das versehentliche Überschreiben von Daten.
*   Die `loadGame`-Funktion lädt in diesem Schritt bewusst *nur* die Grunddaten. Das Laden der komplexeren Daten (Inventar, Pokémon) erfolgt in den nächsten Tickets, um die Komplexität schrittweise zu erhöhen.