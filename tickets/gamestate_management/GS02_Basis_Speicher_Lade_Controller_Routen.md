# Ticket GS02: Basis-Speicher/Lade-Controller & Routen

**Ziel:** Implementierung der grundlegenden Server-Endpunkte zum Speichern und Laden der Spieler-Grunddaten (Position, Karte, Geld, Spielzeit etc.). Erstellung des `saveController.js` und der `saveRoutes.js`.

**Hintergrund & Logik:**
Nachdem die Datenmodelle in GS01 vorbereitet wurden, benötigen wir nun die serverseitige Logik, um die Daten eines Spielers zu speichern und wieder abzurufen. Wir erstellen einen dedizierten Controller (`saveController.js`), der die Datenbankinteraktionen kapselt, und einen Router (`saveRoutes.js`), der die HTTP-Anfragen an die entsprechenden Controller-Funktionen weiterleitet. In diesem ersten Schritt konzentrieren wir uns nur auf die Grunddaten des `Player`-Modells. Das Laden der assoziierten Daten (Inventar, Pokémon etc.) erfolgt in späteren Tickets.

**Arbeitsschritte:**

1.  **`saveController.js` erstellen (`server/controllers/saveController.js`):**
    *   Erstelle eine neue Datei `server/controllers/saveController.js`.
    *   Importiere die notwendigen Module:
        ```javascript
        const db = require('../models');
        ```
    *   Implementiere die `saveGame`-Funktion:
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
    *   Implementiere die `loadGame`-Funktion:
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

2.  **`saveRoutes.js` erstellen (`server/routes/saveRoutes.js`):**
    *   Erstelle eine neue Datei `server/routes/saveRoutes.js`.
    *   Füge folgenden Code ein, um die Routen zu definieren:
        ```javascript
        // server/routes/saveRoutes.js
        const express = require('express');
        const router = express.Router();
        const saveController = require('../controllers/saveController');
        // Wichtig: Die Authentifizierungs-Middleware importieren
        const { authenticate } = require('../middleware/authMiddleware');

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

3.  **Routen in Server integrieren (`server/index.js`):**
    *   Öffne die Datei `server/index.js`.
    *   Importiere die neuen Routen:
        ```javascript
        const saveRoutes = require('./routes/saveRoutes');
        ```
    *   Binde die Routen unter dem Präfix `/api/save` ein (nach den Auth-Routen):
        ```javascript
        // API Routen Definition
        webApp.use('/api/auth', authRoutes);
        webApp.use('/api/save', saveRoutes); // NEU
        // webApp.use('/api/game', authenticate, gameRoutes); // Beispiel für andere geschützte Routen
        ```

**Akzeptanzkriterien:**

*   Die Datei `server/controllers/saveController.js` existiert und enthält die Funktionen `saveGame` und `loadGame`.
*   Die Datei `server/routes/saveRoutes.js` existiert und definiert die Routen `POST /api/save/save` und `GET /api/save/load`, die die entsprechenden Controller-Funktionen aufrufen und die `authenticate`-Middleware verwenden.
*   Die `saveRoutes` sind korrekt in `server/index.js` eingebunden.
*   Ein authentifizierter POST-Request an `/api/save/save` mit Daten im Body (z.B. `{ "position": { "x": 100, "y": 150 }, "isRunning": true }`) aktualisiert die entsprechenden Felder des Spielers in der Datenbank und gibt eine Erfolgsantwort zurück.
*   Ein authentifizierter GET-Request an `/api/save/load` gibt die Grunddaten des Spielers im erwarteten JSON-Format zurück.
*   Nicht authentifizierte Requests an diese Endpunkte werden mit Status 401 abgewiesen.
*   Der Server startet ohne Fehler bezüglich des neuen Controllers oder der Routen.

**Wichtige Hinweise:**
*   Die `authenticate`-Middleware ist entscheidend, um sicherzustellen, dass nur eingeloggte Spieler ihren Spielstand speichern/laden können. Sie stellt die Spieler-ID über `req.player.id` bereit.
*   Die `saveGame`-Funktion sollte robust sein und nur die Felder aktualisieren, die tatsächlich im Request-Body übergeben werden.
*   Die `loadGame`-Funktion lädt in diesem Schritt bewusst *nur* die Grunddaten. Das Laden der komplexeren Daten (Inventar, Pokémon) erfolgt in den nächsten Tickets, um die Komplexität schrittweise zu erhöhen.