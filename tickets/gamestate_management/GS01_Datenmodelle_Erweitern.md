# Ticket GS01: Datenmodelle erweitern/erstellen für Spielstand

**Ziel:** Erweiterung des bestehenden `Player`-Modells und Erstellung neuer Modelle (`Progress`, `Achievement`) in Sequelize, um alle notwendigen Daten für die Spielstand-Speicherung abbilden zu können. Definition der Beziehungen zwischen den Modellen.

**Hintergrund & Logik:**
Um den Spielstand eines Spielers persistent speichern zu können, benötigen wir eine klare Struktur in unserer Datenbank. Das `Player`-Modell enthält bereits grundlegende Benutzerdaten und Authentifizierungsinformationen. Wir müssen es erweitern, um spielspezifische Daten wie Position, Geld und Spielzeit zu speichern. Zusätzlich benötigen wir separate Tabellen (Modelle), um komplexere, potenziell umfangreiche Daten wie Quest-Fortschritte und freigeschaltete Errungenschaften zu verwalten. Dies folgt dem Prinzip der Normalisierung in relationalen Datenbanken.

**Arbeitsschritte:**

1.  **`Player`-Modell erweitern (`server/models/Player.js`):**
    *   Öffne die Datei `server/models/Player.js`.
    *   Füge innerhalb des `sequelize.define('Player', { ... })`-Blocks die folgenden neuen Felder hinzu:
        ```javascript
        // Neue Felder für den Spielfortschritt
        current_map: {
          type: DataTypes.STRING(50),
          defaultValue: 'starter_town', // Standard-Startkarte
          allowNull: false // Jede Position braucht eine Karte
        },
        // position_x und position_y sind bereits vorhanden, ggf. Defaults prüfen/anpassen
        // is_running ist bereits vorhanden, ggf. Default prüfen/anpassen
        money: {
          type: DataTypes.INTEGER,
          defaultValue: 1000, // Startgeld
          allowNull: false
        },
        play_time: {
          type: DataTypes.INTEGER,
          defaultValue: 0,  // Spielzeit in Sekunden
          allowNull: false
        },
        last_save: {
          type: DataTypes.DATE,
          allowNull: true // Kann null sein, wenn noch nie gespeichert wurde
        },
        last_heal: { // Zeitpunkt der letzten Heilung (z.B. im Pokémon Center)
          type: DataTypes.DATE,
          allowNull: true
        }
        ```
    *   Stelle sicher, dass die Optionen `timestamps: true` und `underscored: true` gesetzt sind.

2.  **`Progress`-Modell erstellen (`server/models/Progress.js`):**
    *   Erstelle eine neue Datei `server/models/Progress.js`.
    *   Füge folgenden Code ein, um das Modell für den Quest-Fortschritt zu definieren:
        ```javascript
        // server/models/Progress.js
        const { DataTypes } = require('sequelize');

        module.exports = (sequelize) => {
          const Progress = sequelize.define('Progress', {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            // Fremdschlüssel zum Spieler wird durch Assoziation hinzugefügt (player_id)
            quest_key: { // Eindeutiger Schlüssel der Quest (z.B. 'find_prof_oak')
              type: DataTypes.STRING(50),
              allowNull: false
            },
            status: { // Aktueller Status der Quest
              type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'failed'),
              defaultValue: 'not_started',
              allowNull: false
            },
            progress_data: { // JSON-Feld für quests-spezifische Daten (z.B. Zähler, gefundene Items)
              type: DataTypes.JSON,
              defaultValue: {},
              allowNull: true
            },
            completed_at: { // Zeitstempel, wann die Quest abgeschlossen wurde
              type: DataTypes.DATE,
              allowNull: true
            }
          }, {
            timestamps: true,
            underscored: true,
            indexes: [ // Index für schnelles Nachschlagen pro Spieler und Quest
              {
                unique: true, // Ein Spieler kann jede Quest nur einmal haben
                fields: ['player_id', 'quest_key']
              }
            ]
          });

          return Progress;
        };
        ```

3.  **`Achievement`-Modell erstellen (`server/models/Achievement.js`):**
    *   Erstelle eine neue Datei `server/models/Achievement.js`.
    *   Füge folgenden Code ein, um das Modell für Errungenschaften zu definieren:
        ```javascript
        // server/models/Achievement.js
        const { DataTypes } = require('sequelize');

        module.exports = (sequelize) => {
          const Achievement = sequelize.define('Achievement', {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            // Fremdschlüssel zum Spieler wird durch Assoziation hinzugefügt (player_id)
            achievement_key: { // Eindeutiger Schlüssel der Errungenschaft (z.B. 'caught_10_pokemon')
              type: DataTypes.STRING(50),
              allowNull: false
            },
            unlocked_at: { // Zeitstempel, wann die Errungenschaft freigeschaltet wurde
              type: DataTypes.DATE,
              defaultValue: DataTypes.NOW,
              allowNull: false
            }
          }, {
            timestamps: true, // Nur `createdAt` und `updatedAt`
            underscored: true,
            indexes: [ // Index für schnelles Nachschlagen pro Spieler und Errungenschaft
              {
                unique: true, // Ein Spieler kann jede Errungenschaft nur einmal freischalten
                fields: ['player_id', 'achievement_key']
              }
            ]
          });

          return Achievement;
        };
        ```

4.  **Modelle in `index.js` importieren und assoziieren (`server/models/index.js`):**
    *   Öffne die Datei `server/models/index.js`.
    *   Importiere die neuen Modelle am Anfang der Datei:
        ```javascript
        const ProgressModel = require('./Progress');
        const AchievementModel = require('./Achievement');
        ```
    *   Initialisiere die Modelle innerhalb der `fs.readdirSync...`-Schleife oder danach:
        ```javascript
        db['Progress'] = ProgressModel(sequelize, DataTypes);
        db['Achievement'] = AchievementModel(sequelize, DataTypes);
        ```
    *   Füge die Assoziationen hinzu, nachdem alle Modelle initialisiert wurden (innerhalb des `Object.keys(db).forEach(modelName => { ... });`-Blocks oder danach):
        ```javascript
        // Spieler <-> Fortschritt (1:n)
        db.Player.hasMany(db.Progress, { foreignKey: 'player_id', onDelete: 'CASCADE' });
        db.Progress.belongsTo(db.Player, { foreignKey: 'player_id' });

        // Spieler <-> Errungenschaften (1:n)
        db.Player.hasMany(db.Achievement, { foreignKey: 'player_id', onDelete: 'CASCADE' });
        db.Achievement.belongsTo(db.Player, { foreignKey: 'player_id' });
        ```
    *   Stelle sicher, dass `onDelete: 'CASCADE'` hinzugefügt wird, damit Fortschritte und Errungenschaften automatisch gelöscht werden, wenn ein Spieler gelöscht wird.

**Akzeptanzkriterien:**

*   Das `Player`-Modell enthält die neuen Felder `current_map`, `money`, `play_time`, `last_save`, `last_heal`.
*   Die neuen Dateien `server/models/Progress.js` und `server/models/Achievement.js` existieren und enthalten die korrekten Modelldefinitionen.
*   Die neuen Modelle `Progress` und `Achievement` sind in `server/models/index.js` importiert und initialisiert.
*   Die `hasMany`/`belongsTo`-Assoziationen zwischen `Player`, `Progress` und `Achievement` sind in `server/models/index.js` korrekt definiert.
*   Der Server startet ohne Fehler bezüglich der Modelldefinitionen oder Assoziationen.
*   Ein `sequelize.sync({ force: true })` (im Entwicklungsmodus) erstellt die neuen Tabellen und Spalten korrekt in der Datenbank.

**Wichtige Hinweise:**
*   Die `defaultValue`-Werte sind Startwerte für neue Spieler.
*   Die `allowNull`-Einstellungen stellen sicher, dass wichtige Daten vorhanden sind.
*   Die Indizes in `Progress` und `Achievement` verbessern die Abfrageleistung und stellen die Eindeutigkeit sicher.
*   `onDelete: 'CASCADE'` ist wichtig für die Datenintegrität beim Löschen von Spielern.
              allowNull: true
            },
            completed_at: { // Zeitstempel, wann die Quest abgeschlossen wurde
              type: DataTypes.DATE,
              allowNull: true
            }
          }, {
            timestamps: true,
            underscored: true,
            indexes: [ // Index für schnelles Nachschlagen pro Spieler und Quest
              {
                unique: true, // Ein Spieler kann jede Quest nur einmal haben
                fields: ['player_id', 'quest_key']
              }
            ]
          });

          return Progress;
        };
        ```

3.  **`Achievement`-Modell erstellen (`server/models/Achievement.js`):**
    *   Erstelle eine neue Datei `server/models/Achievement.js`.
    *   Füge folgenden Code ein, um das Modell für Errungenschaften zu definieren:
        ```javascript
        // server/models/Achievement.js
        const { DataTypes } = require('sequelize');

        module.exports = (sequelize) => {
          const Achievement = sequelize.define('Achievement', {
            id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false
            },
            // Fremdschlüssel zum Spieler wird durch Assoziation hinzugefügt (player_id)
            achievement_key: { // Eindeutiger Schlüssel der Errungenschaft (z.B. 'caught_10_pokemon')
              type: DataTypes.STRING(50),
              allowNull: false
            },
            unlocked_at: { // Zeitstempel, wann die Errungenschaft freigeschaltet wurde
              type: DataTypes.DATE,
              defaultValue: DataTypes.NOW,
              allowNull: false
            }
          }, {
            timestamps: true, // Nur `createdAt` und `updatedAt`
            underscored: true,
            indexes: [ // Index für schnelles Nachschlagen pro Spieler und Errungenschaft
              {
                unique: true, // Ein Spieler kann jede Errungenschaft nur einmal freischalten
                fields: ['player_id', 'achievement_key']
              }
            ]
          });

          return Achievement;
        };
        ```

4.  **Modelle in `index.js` importieren und assoziieren (`server/models/index.js`):**
    *   Öffne die Datei `server/models/index.js`.
    *   Importiere die neuen Modelle am Anfang der Datei:
        ```javascript
        const ProgressModel = require('./Progress');
        const AchievementModel = require('./Achievement');
        ```
    *   Initialisiere die Modelle innerhalb der `fs.readdirSync...`-Schleife oder danach:
        ```javascript
        db['Progress'] = ProgressModel(sequelize, DataTypes);
        db['Achievement'] = AchievementModel(sequelize, DataTypes);
        ```
    *   Füge die Assoziationen hinzu, nachdem alle Modelle initialisiert wurden (innerhalb des `Object.keys(db).forEach(modelName => { ... });`-Blocks oder danach):
        ```javascript
        // Spieler <-> Fortschritt (1:n)
        db.Player.hasMany(db.Progress, { foreignKey: 'player_id', onDelete: 'CASCADE' });
        db.Progress.belongsTo(db.Player, { foreignKey: 'player_id' });

        // Spieler <-> Errungenschaften (1:n)
        db.Player.hasMany(db.Achievement, { foreignKey: 'player_id', onDelete: 'CASCADE' });
        db.Achievement.belongsTo(db.Player, { foreignKey: 'player_id' });
        ```
    *   Stelle sicher, dass `onDelete: 'CASCADE'` hinzugefügt wird, damit Fortschritte und Errungenschaften automatisch gelöscht werden, wenn ein Spieler gelöscht wird.

**Akzeptanzkriterien:**

*   Das `Player`-Modell enthält die neuen Felder `current_map`, `money`, `play_time`, `last_save`, `last_heal`.
*   Die neuen Dateien `server/models/Progress.js` und `server/models/Achievement.js` existieren und enthalten die korrekten Modelldefinitionen.
*   Die neuen Modelle `Progress` und `Achievement` sind in `server/models/index.js` importiert und initialisiert.
*   Die `hasMany`/`belongsTo`-Assoziationen zwischen `Player`, `Progress` und `Achievement` sind in `server/models/index.js` korrekt definiert.
*   Der Server startet ohne Fehler bezüglich der Modelldefinitionen oder Assoziationen.
*   Ein `sequelize.sync({ force: true })` (im Entwicklungsmodus) erstellt die neuen Tabellen und Spalten korrekt in der Datenbank.

**Wichtige Hinweise:**
*   Die `defaultValue`-Werte sind Startwerte für neue Spieler.
*   Die `allowNull`-Einstellungen stellen sicher, dass wichtige Daten vorhanden sind.
*   Die Indizes in `Progress` und `Achievement` verbessern die Abfrageleistung und stellen die Eindeutigkeit sicher.
*   `onDelete: 'CASCADE'` ist wichtig für die Datenintegrität beim Löschen von Spielern.