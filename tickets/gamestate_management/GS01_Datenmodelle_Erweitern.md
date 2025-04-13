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

# Ticket GS01: Datenmodelle erweitern/erstellen für Spielstand

**Ziel:**  
Erweiterung des bestehenden `Player`-Modells und Erstellung neuer Modelle (`Progress`, `Achievement`) in Sequelize, um alle notwendigen Daten für die Spielstand-Speicherung abbilden zu können. Definition der Beziehungen zwischen den Modellen.

---

## 1. Grundprinzipien & Zielsetzung

Die Datenmodellierung ist das Fundament für jede persistente Spielstand-Speicherung. Sie bestimmt, wie flexibel, performant und erweiterbar das System später ist. Ziel ist es, alle relevanten Informationen über den Fortschritt eines Spielers in der Spielwelt so zu strukturieren, dass sie effizient gespeichert, abgerufen und aktualisiert werden können.

- **Datenintegrität:** Die Daten müssen konsistent und korrekt sein. Das bedeutet, dass Beziehungen zwischen Daten (z.B. ein Spieler besitzt ein bestimmtes Item) korrekt abgebildet und durchgesetzt werden müssen.
- **Normalisierung:** Redundanz in den Daten sollte vermieden werden, um Speicherplatz zu sparen und Inkonsistenzen zu verhindern. Das bedeutet, dass verwandte Daten in separaten Tabellen gespeichert und über Beziehungen verknüpft werden.
- **Performance:** Die Datenbankstruktur muss so optimiert sein, dass häufige Abfragen (z.B. Laden des Spielstands, Aktualisieren der Position) schnell ausgeführt werden können. Das kann durch geeignete Indizes erreicht werden.
- **Flexibilität:** Das System muss erweiterbar sein, um zukünftige Features und neue Arten von Spielstand-Daten aufnehmen zu können, ohne die bestehende Struktur grundlegend zu verändern.
- **Wartbarkeit:** Die Modelle und Beziehungen sollen klar und verständlich sein, um die Wartung und Weiterentwicklung zu erleichtern.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. `Player`-Modell erweitern

- **Ziel:** Hinzufügen von Spalten zum `Player`-Modell, um den aktuellen Zustand des Spielers zu speichern (Position, aktuelle Karte, Geld, Spielzeit, letzter Speicherzeitpunkt).
- **Warum:** Diese Daten sind essentiell, um das Spiel persistent zu machen und dem Spieler zu ermöglichen, seinen Fortschritt fortzusetzen. Sie repräsentieren den grundlegenden "Fußabdruck" des Spielers in der Spielwelt.
- **Details zu den einzelnen Feldern:**
    - `current_map`: Die ID der aktuellen Karte, auf der sich der Spieler befindet. Dies ermöglicht das Laden der korrekten Spielwelt beim nächsten Login.
        - `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend, um die meisten Kartennamen zu speichern.
        - `defaultValue: 'starter_town'` : Der Standardwert ist die Startkarte, auf der neue Spieler beginnen.
        - `allowNull: false`: Jeder Spieler muss immer auf einer Karte sein.
        - `comment: 'Aktuelle Karte des Spielers'` : Ein optionaler Kommentar zur Dokumentation.
    - `position_x` und `position_y`: Die X- und Y-Koordinaten des Spielers auf der aktuellen Karte.
        - `type: DataTypes.FLOAT`: Gleitkommazahlen ermöglichen eine feinere Auflösung der Position.
        - `defaultValue: 0`: Der Standardwert ist der Ursprung (0, 0) der Karte.
        - `allowNull: false`: Jeder Spieler muss eine definierte Position haben.
    - `is_running`: Ein Flag, das angibt, ob der Spieler gerade rennt oder geht. Dies kann die Bewegungsgeschwindigkeit beeinflussen.
        - `type: DataTypes.BOOLEAN`: Ein boolescher Wert (true/false) ist ausreichend.
        - `defaultValue: false`: Der Standardwert ist "Gehen".
        - `allowNull: false`: Der Laufstatus muss immer definiert sein.
    - `money`: Die Menge an Geld, die der Spieler besitzt.
        - `type: DataTypes.INTEGER`: Eine Ganzzahl ist ausreichend, da Geld in der Regel nicht in Bruchteilen vorkommt.
        - `defaultValue: 1000`: Ein Startbetrag für neue Spieler.
        - `allowNull: false`: Der Geldbetrag muss immer definiert sein.
    - `play_time`: Die Gesamtspielzeit des Spielers in Sekunden.
        - `type: DataTypes.INTEGER`: Eine Ganzzahl ist ausreichend, um die Spielzeit in Sekunden zu speichern.
        - `defaultValue: 0`: Neue Spieler beginnen mit 0 Sekunden Spielzeit.
        - `allowNull: false`: Die Spielzeit muss immer definiert sein.
    - `last_save`: Der Zeitstempel der letzten Speicherung des Spielstands.
        - `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        - `allowNull: true`: Kann null sein, wenn der Spieler seinen Spielstand noch nie gespeichert hat.
    - `last_heal`: Der Zeitpunkt der letzten Heilung des Spielers (z.B. im Pokémon Center).
        - `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        - `allowNull: true`: Kann null sein, wenn der Spieler noch nie geheilt wurde.
- **Schritte:**
    *   Öffne die Datei `server/models/Player.js`.
    *   Füge innerhalb des `sequelize.define('Player', { ... })`-Blocks (d.h. innerhalb der geschweiften Klammern, die die Spaltendefinitionen enthalten) die oben genannten neuen Felder hinzu.
    *   Stelle sicher, dass die Optionen `timestamps: true` und `underscored: true` *außerhalb* des `sequelize.define`-Blocks, aber innerhalb des Konfigurationsobjekts gesetzt sind:
        ```javascript
        }, {
          timestamps: true, // Fügt createdAt und updatedAt automatisch hinzu
          underscored: true, // Konvertiert camelCase zu snake_case (z.B. passwordHash -> password_hash)
        });
        ```

### 2.2. `Progress`-Modell erstellen

- **Ziel:** Erstellung eines neuen Modells zur Speicherung des Fortschritts des Spielers in einzelnen Quests.
- **Warum:** Quests sind ein wichtiger Bestandteil des Spiels und müssen persistent gespeichert werden. Ein separates Modell ermöglicht eine flexible und effiziente Verwaltung des Quest-Fortschritts.
- **Details zu den einzelnen Feldern:**
    - `quest_key`: Ein eindeutiger Schlüssel, der die Quest identifiziert (z.B. 'find_prof_oak', 'defeat_gym_leader_1').
        - `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend.
        - `allowNull: false`: Jede Fortschritts-Eintrag muss zu einer Quest gehören.
    - `status`: Der aktuelle Status der Quest (nicht gestartet, in Bearbeitung, abgeschlossen, fehlgeschlagen).
        - `type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'failed')`: Ein Enum stellt sicher, dass nur gültige Statuswerte verwendet werden.
        - `defaultValue: 'not_started'`: Neue Quests beginnen im Status "nicht gestartet".
        - `allowNull: false`: Der Status muss immer definiert sein.
    - `progress_data`: Ein JSON-Objekt, das quest-spezifische Daten speichert (z.B. Anzahl der gesammelten Items, aktuelle Phase der Quest).
        - `type: DataTypes.JSON`: Ermöglicht die Speicherung beliebiger Datenstrukturen.
        - `defaultValue: {}`: Neue Quests beginnen mit einem leeren Datenobjekt.
        - `allowNull: true`: Nicht alle Quests benötigen zusätzliche Daten.
    - `completed_at`: Ein Zeitstempel, wann die Quest abgeschlossen wurde.
        - `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        - `allowNull: true`: Ist nur gesetzt, wenn die Quest abgeschlossen ist.
- **Schritte:**
    *   Erstelle eine neue Datei `server/models/Progress.js`.
    *   Füge folgenden Code ein, um das Modell zu definieren:
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

### 2.3. `Achievement`-Modell erstellen

- **Ziel:** Erstellung eines neuen Modells zur Speicherung der freigeschalteten Errungenschaften des Spielers.
- **Warum:** Errungenschaften sind ein wichtiges Element des Fortschrittssystems und müssen persistent gespeichert werden. Ein separates Modell ermöglicht eine einfache Abfrage und Verwaltung der freigeschalteten Errungenschaften.
- **Details zu den einzelnen Feldern:**
    - `achievement_key`: Ein eindeutiger Schlüssel, der die Errungenschaft identifiziert (z.B. 'caught_10_pokemon', 'beat_elite_four').
        - `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend.
        - `allowNull: false`: Jede Errungenschaft muss einen Schlüssel haben.
    - `unlocked_at`: Ein Zeitstempel, wann die Errungenschaft freigeschaltet wurde.
        - `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        - `defaultValue: DataTypes.NOW`: Der Standardwert ist der aktuelle Zeitpunkt.
        - `allowNull: false`: Der Zeitpunkt muss immer gesetzt sein.
- **Schritte:**
    *   Erstelle eine neue Datei `server/models/Achievement.js`.
    *   Füge folgenden Code ein, um das Modell zu definieren:
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

### 2.4. Modelle in `index.js` importieren und assoziieren

- **Ziel:** Die neuen Modelle dem Sequelize-Kontext hinzufügen und die Beziehungen zwischen `Player`, `Progress` und `Achievement` definieren.
- **Warum:** Sequelize benötigt eine zentrale Stelle, an der alle Modelle importiert und initialisiert werden, um die Beziehungen korrekt zu verwalten.
- **Schritte:**
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
        - `foreignKey: 'player_id'` : Definiert den Namen der Spalte im `Progress`- und `Achievement`-Modell, die auf die ID des `Player`-Modells verweist.
        - `onDelete: 'CASCADE'` : Sorgt dafür, dass alle zugehörigen Fortschritts- und Errungenschaftsdaten automatisch gelöscht werden, wenn ein Spieler gelöscht wird. Dies ist wichtig, um verwaiste Datensätze zu vermeiden und die Datenintegrität zu gewährleisten.

---

## 3. Arbeitsschritte

1.  **`Player`-Modell erweitern (`server/models/Player.js`):**
    *   Öffne die Datei `server/models/Player.js`.
    *   Füge innerhalb des `sequelize.define('Player', { ... })`-Blocks die oben genannten neuen Felder hinzu.
    *   Stelle sicher, dass die Optionen `timestamps: true` und `underscored: true` gesetzt sind.

2.  **`Progress`-Modell erstellen (`server/models/Progress.js`):**
    *   Erstelle eine neue Datei `server/models/Progress.js`.
    *   Füge folgenden Code ein, um das Modell für den Quest-Fortschritt zu definieren:
        ```javascript
        // Code für Progress.js (siehe oben)
        ```

3.  **`Achievement`-Modell erstellen (`server/models/Achievement.js`):**
    *   Erstelle eine neue Datei `server/models/Achievement.js`.
    *   Füge folgenden Code ein, um das Modell für Errungenschaften zu definieren:
        ```javascript
        // Code für Achievement.js (siehe oben)
        ```

4.  **Modelle in `index.js` importieren und assoziieren (`server/models/index.js`):**
    *   Öffne die Datei `server/models/index.js`.
    *   Importiere die neuen Modelle am Anfang der Datei.
    *   Initialisiere die Modelle innerhalb der `fs.readdirSync...`-Schleife oder danach.
    *   Füge die Assoziationen hinzu, nachdem alle Modelle initialisiert wurden.

---

## 4. Akzeptanzkriterien

*   Das `Player`-Modell enthält die neuen Felder `current_map`, `money`, `play_time`, `last_save`, `last_heal`.
*   Die neuen Dateien `server/models/Progress.js` und `server/models/Achievement.js` existieren und enthalten die korrekten Modelldefinitionen.
*   Die neuen Modelle `Progress` und `Achievement` sind in `server/models/index.js` importiert und initialisiert.
*   Die `hasMany`/`belongsTo`-Assoziationen zwischen `Player`, `Progress` und `Achievement` sind in `server/models/index.js` korrekt definiert.
*   Der Server startet ohne Fehler bezüglich der Modelldefinitionen oder Assoziationen.
*   Ein `sequelize.sync({ force: true })` (im Entwicklungsmodus) erstellt die neuen Tabellen und Spalten korrekt in der Datenbank.

---

## 5. Wichtige Hinweise

*   Die `defaultValue`-Werte sind Startwerte für neue Spieler.
*   Die `allowNull`-Einstellungen stellen sicher, dass wichtige Daten vorhanden sind.
*   Die Indizes in `Progress` und `Achievement` verbessern die Abfrageleistung und stellen die Eindeutigkeit sicher.
*   `onDelete: 'CASCADE'` ist wichtig für die Datenintegrität beim Löschen von Spielern.