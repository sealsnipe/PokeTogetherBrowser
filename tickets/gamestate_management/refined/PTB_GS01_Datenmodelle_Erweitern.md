## Einführung für neue Bearbeiter

Das vorliegende Ticket GS01 beschäftigt sich mit der Erweiterung und Erstellung von Datenmodellen für die Spielstand-Speicherung im PokeTogetherBrowser-Projekt. Nach eingehender Analyse der bereitgestellten Informationen präsentiere ich eine verfeinerte Version dieses Tickets, die alle wesentlichen Aspekte abdeckt. Obwohl der Fokus auf der Spielstand-Speicherung liegt, werden auch allgemeine Best Practices für die performante und wartbare Datenmodellierung mit Sequelize im Spiele-Kontext berücksichtigt.

**Projektkontext und technologischer Rahmen**

Das PokeTogetherBrowser-Projekt basiert auf einer modernen Webstack-Architektur mit Node.js und Express als Backend-Framework. Für die Datenpersistenz wird Sequelize als ORM (Object-Relational Mapper) eingesetzt, das mit einer relationalen Datenbank (vermutlich PostgreSQL oder MySQL) kommuniziert. Die Spielstand-Speicherung ist ein essentieller Bestandteil des Spielerlebnisses und erfordert eine sorgfältige Modellierung, um alle relevanten Aspekte des Spielfortschritts zuverlässig zu erfassen.

Die Verwendung von Sequelize bietet mehrere Vorteile: Es abstrahiert die direkten SQL-Anfragen, ermöglicht eine objektorientierte Interaktion mit der Datenbank und vereinfacht die Definition von Beziehungen zwischen verschiedenen Entitäten. Für die Implementierung der Datenmodelle ist ein fundiertes Verständnis von JavaScript (ES6+), asynchroner Programmierung und der Sequelize-API erforderlich.

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

# Ticket GS01 (Verfeinert): Datenmodelle erweitern/erstellen für Spielstand

**Ziel:**
Erweiterung des bestehenden `Player`-Modells und Erstellung neuer Modelle (`Progress`, `Achievement`) in Sequelize, um alle notwendigen Daten für die Spielstand-Speicherung abbilden zu können. Definition der Beziehungen zwischen den Modellen und Berücksichtigung von Best Practices für Migrationen, Validierung, Indizierung und Transaktionen.

---

## 1. Grundprinzipien & Zielsetzung

Die Datenmodellierung ist das Fundament für jede persistente Spielstand-Speicherung. Sie bestimmt, wie flexibel, performant und erweiterbar das System später ist. Ziel ist es, alle relevanten Informationen über den Fortschritt eines Spielers in der Spielwelt so zu strukturieren, dass sie effizient gespeichert, abgerufen und aktualisiert werden können.

*   **Datenintegrität:** Die Daten müssen konsistent und korrekt sein. Das bedeutet, dass Beziehungen zwischen Daten (z.B. ein Spieler besitzt ein bestimmtes Item) korrekt abgebildet und durchgesetzt werden müssen.
*   **Normalisierung:** Redundanz in den Daten sollte vermieden werden, um Speicherplatz zu sparen und Inkonsistenzen zu verhindern. Das bedeutet, dass verwandte Daten in separaten Tabellen gespeichert und über Beziehungen verknüpft werden.
*   **Performance:** Die Datenbankstruktur muss so optimiert sein, dass häufige Abfragen (z.B. Laden des Spielstands, Aktualisieren der Position) schnell ausgeführt werden können. Das kann durch geeignete Indizes erreicht werden.
*   **Flexibilität:** Das System muss erweiterbar sein, um zukünftige Features und neue Arten von Spielstand-Daten aufnehmen zu können, ohne die bestehende Struktur grundlegend zu verändern.
*   **Wartbarkeit:** Die Modelle und Beziehungen sollen klar und verständlich sein, um die Wartung und Weiterentwicklung zu erleichtern.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. `Player`-Modell erweitern

*   **Ziel:** Hinzufügen von Spalten zum `Player`-Modell, um den aktuellen Zustand des Spielers zu speichern (Position, aktuelle Karte, Geld, Spielzeit, letzter Speicherzeitpunkt).
*   **Warum:** Diese Daten sind essentiell, um das Spiel persistent zu machen und dem Spieler zu ermöglichen, seinen Fortschritt fortzusetzen. Sie repräsentieren den grundlegenden "Fußabdruck" des Spielers in der Spielwelt.
*   **Details zu den einzelnen Feldern:**
    *   `current_map`: Die ID der aktuellen Karte, auf der sich der Spieler befindet. Dies ermöglicht das Laden der korrekten Spielwelt beim nächsten Login.
        *   `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend, um die meisten Kartennamen zu speichern.
        *   `defaultValue: 'starter_town'` : Der Standardwert ist die Startkarte, auf der neue Spieler beginnen.
        *   `allowNull: false`: Jeder Spieler muss immer auf einer Karte sein.
        *   `comment: 'Aktuelle Karte des Spielers'` : Ein optionaler Kommentar zur Dokumentation.
    *   `position_x` und `position_y`: Die X- und Y-Koordinaten des Spielers auf der aktuellen Karte.
        *   `type: DataTypes.FLOAT`: Gleitkommazahlen ermöglichen eine feinere Auflösung der Position.
        *   `defaultValue: 0`: Der Standardwert ist der Ursprung (0, 0) der Karte.
        *   `allowNull: false`: Jeder Spieler muss eine definierte Position haben.
    *   `is_running`: Ein Flag, das angibt, ob der Spieler gerade rennt oder geht. Dies kann die Bewegungsgeschwindigkeit beeinflussen.
        *   `type: DataTypes.BOOLEAN`: Ein boolescher Wert (true/false) ist ausreichend.
        *   `defaultValue: false`: Der Standardwert ist "Gehen".
        *   `allowNull: false`: Der Laufstatus muss immer definiert sein.
    *   `money`: Die Menge an Geld, die der Spieler besitzt.
        *   `type: DataTypes.INTEGER`: Eine Ganzzahl ist ausreichend, da Geld in der Regel nicht in Bruchteilen vorkommt.
        *   `defaultValue: 1000`: Ein Startbetrag für neue Spieler.
        *   `allowNull: false`: Der Geldbetrag muss immer definiert sein.
    *   `play_time`: Die Gesamtspielzeit des Spielers in Sekunden.
        *   `type: DataTypes.INTEGER`: Eine Ganzzahl ist ausreichend, um die Spielzeit in Sekunden zu speichern.
        *   `defaultValue: 0`: Neue Spieler beginnen mit 0 Sekunden Spielzeit.
        *   `allowNull: false`: Die Spielzeit muss immer definiert sein.
    *   `last_save`: Der Zeitstempel der letzten Speicherung des Spielstands.
        *   `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        *   `allowNull: true`: Kann null sein, wenn der Spieler seinen Spielstand noch nie gespeichert hat.
    *   `last_heal`: Der Zeitpunkt der letzten Heilung des Spielers (z.B. im Pokémon Center).
        *   `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        *   `allowNull: true`: Kann null sein, wenn der Spieler noch nie geheilt wurde.
*   **Schritte:**
    *   Öffne die Datei `server/models/Player.js`.
    *   Füge innerhalb des `sequelize.define('Player', { ... })`-Blocks die oben genannten neuen Felder hinzu.
    *   Stelle sicher, dass die Optionen `timestamps: true` und `underscored: true` *außerhalb* des `sequelize.define`-Blocks, aber innerhalb des Konfigurationsobjekts gesetzt sind:
        ```javascript
        }, {
          timestamps: true, // Fügt createdAt und updatedAt automatisch hinzu
          underscored: true, // Konvertiert camelCase zu snake_case (z.B. passwordHash -> password_hash)
        });
        ```

### 2.2. `Progress`-Modell erstellen

*   **Ziel:** Erstellung eines neuen Modells zur Speicherung des Fortschritts des Spielers in einzelnen Quests.
*   **Warum:** Quests sind ein wichtiger Bestandteil des Spiels und müssen persistent gespeichert werden. Ein separates Modell ermöglicht eine flexible und effiziente Verwaltung des Quest-Fortschritts.
*   **Details zu den einzelnen Feldern:**
    *   `quest_key`: Ein eindeutiger Schlüssel, der die Quest identifiziert (z.B. 'find_prof_oak', 'defeat_gym_leader_1').
        *   `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend, um die meisten Kartennamen zu speichern.
        *   `allowNull: false`: Jede Fortschritts-Eintrag muss zu einer Quest gehören.
    *   `status`: Der aktuelle Status der Quest (nicht gestartet, in Bearbeitung, abgeschlossen, fehlgeschlagen).
        *   `type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'failed')`: Ein Enum stellt sicher, dass nur gültige Statuswerte verwendet werden.
        *   `defaultValue: 'not_started'`: Neue Quests beginnen im Status "nicht gestartet".
        *   `allowNull: false`: Der Status muss immer definiert sein.
    *   `progress_data`: Ein JSON-Objekt, das quest-spezifische Daten speichert (z.B. Anzahl der gesammelten Items, aktuelle Phase der Quest).
        *   `type: DataTypes.JSON`: Ermöglicht die Speicherung beliebiger Datenstrukturen.
        *   `defaultValue: {}`: Neue Quests beginnen mit einem leeren Datenobjekt.
        *   `allowNull: true`: Nicht alle Quests benötigen zusätzliche Daten.
        *   `completed_at`: Ein Zeitstempel, wann die Quest abgeschlossen wurde.
        *   `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        *   `allowNull: true`: Ist nur gesetzt, wenn die Quest abgeschlossen ist.
*   **Schritte:**
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

*   **Ziel:** Erstellung eines neuen Modells zur Speicherung der freigeschalteten Errungenschaften des Spielers.
*   **Warum:** Errungenschaften sind ein wichtiges Element des Fortschrittssystems und müssen persistent gespeichert werden. Ein separates Modell ermöglicht eine einfache Abfrage und Verwaltung der freigeschalteten Errungenschaften.
*   **Details zu den einzelnen Feldern:**
    *   `achievement_key`: Ein eindeutiger Schlüssel, der die Errungenschaft identifiziert (z.B. 'caught_10_pokemon', 'beat_elite_four').
        *   `type: DataTypes.STRING(50)`: Ein String mit maximal 50 Zeichen ist ausreichend, um die meisten Kartennamen zu speichern.
        *   `allowNull: false`: Jede Errungenschaft muss einen Schlüssel haben.
    *   `unlocked_at`: Ein Zeitstempel, wann die Errungenschaft freigeschaltet wurde.
        *   `type: DataTypes.DATE`: Ein Datumsobjekt speichert den Zeitpunkt.
        *   `defaultValue: DataTypes.NOW`: Der Standardwert ist der aktuelle Zeitpunkt.
        *   `allowNull: false`: Der Zeitpunkt muss immer gesetzt sein.
*   **Schritte:**
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

*   **Ziel:** Die neuen Modelle dem Sequelize-Kontext hinzufügen und die Beziehungen zwischen `Player`, `Progress` und `Achievement` definieren.
*   **Warum:** Sequelize benötigt eine zentrale Stelle, an der alle Modelle importiert und initialisiert werden, um die Beziehungen korrekt zu verwalten.
*   **Schritte:**
    *   Öffne die Datei `server/models/index.js`.
    *   Importiere alle Modelle.
    *   Füge sie in der Schleife hinzu, die über die Dateien iteriert (`fs.readdirSync`), oder initialisiere sie explizit danach.
    *   Definiere die Beziehungen zwischen den Modellen.
*   **Beispielcode:**
    ```javascript
    const fs = require('fs');
    const path = require('path');
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize(config.database, config.username, config.password, config);

    const db = {};

    // Modelle importieren
    fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
      });

    // Beziehungen definieren
    db.Player.hasMany(db.Progress, { foreignKey: 'player_id' });
    db.Progress.belongsTo(db.Player, { foreignKey: 'player_id' });

    db.Player.hasMany(db.Achievement, { foreignKey: 'player_id' });
    db.Achievement.belongsTo(db.Player, { foreignKey: 'player_id' });

    module.exports = { ...db, sequelize };
    ```

### 2.5. Visuelles Datenmodell

```mermaid
erDiagram
    PLAYER ||--o{ PROGRESS : Fortschritt
    PLAYER ||--o{ ACHIEVEMENT : Errungenschaft

    PLAYER {
        INTEGER id PK
        STRING username
        STRING password_hash
        STRING email
        DATE created_at
        DATE updated_at
        -- Erweiterungen GS01 --
        STRING current_map STRING(50) FK "Default: 'starter_town', Not Null"
        FLOAT position_x FLOAT "Default: 0, Not Null"
        FLOAT position_y FLOAT "Default: 0, Not Null"
        BOOLEAN is_running BOOLEAN "Default: false, Not Null"
        INTEGER money INTEGER "Default: 1000, Not Null"
        INTEGER play_time INTEGER "Default: 0, Not Null"
        DATE last_save DATE "Nullable"
        DATE last_heal DATE "Nullable"
    }

    PROGRESS {
        INTEGER id PK
        STRING player_id INTEGER FK
        STRING quest_key STRING(50) "Not Null, Index (player_id, quest_key)"
        ENUM status ENUM "('not_started', 'in_progress', 'completed', 'failed'), Default: 'not_started', Not Null"
        JSON progress_data JSON "Default: {}, Nullable"
        DATE completed_at DATE "Nullable"
        DATE created_at
        DATE updated_at
    }

    ACHIEVEMENT {
        INTEGER id PK
        STRING player_id INTEGER FK
        STRING achievement_key STRING(50) "Not Null, Index (player_id, achievement_key)"
        DATE unlocked_at DATE "Default: NOW, Not Null"
        DATE created_at
        DATE updated_at
    }

```

---

## 3. Arbeitsschritte

1.  **`Player`-Modell erweitern (`server/models/Player.js`):**
    *   Öffne die Datei `server/models/Player.js`.
    *   Füge innerhalb des `sequelize.define('Player', { ... })`-Blocks die oben genannten neuen Felder hinzu.
    *   Stelle sicher, dass die Optionen `timestamps: true` und `underscored: true` gesetzt sind.

2.  **`Progress`-Modell erstellen (`server/models/Progress.js`):**
    *   Erstelle eine neue Datei `server/models/Progress.js`.
    *   Füge den Code aus Abschnitt 2.2 ein.

3.  **`Achievement`-Modell erstellen (`server/models/Achievement.js`):**
    *   Erstelle eine neue Datei `server/models/Achievement.js`.
    *   Füge den Code aus Abschnitt 2.3 ein.

4.  **Modelle in `index.js` importieren und assoziieren (`server/models/index.js`):**
    *   Öffne die Datei `server/models/index.js`.
    *   Importiere die neuen Modelle am Anfang der Datei.
    *   Füge sie in der Schleife hinzu, die über die Dateien iteriert (`fs.readdirSync`), oder initialisiere sie explizit danach.
    *   Füge die Assoziationen hinzu, nachdem alle Modelle initialisiert wurden.

5.  **(Empfohlen) Migrationen erstellen:**
    *   Erstelle Sequelize-Migrationen, um die Änderungen an der Datenbankstruktur kontrolliert anzuwenden:
        *   Eine Migration zum Hinzufügen der neuen Spalten zur `players`-Tabelle.
        *   Eine Migration zum Erstellen der `progress`-Tabelle mit Spalten und Indizes.
        *   Eine Migration zum Erstellen der `achievements`-Tabelle mit Spalten und Indizes.
        *   (Die Fremdschlüssel werden oft durch die Assoziationen in den Modellen gehandhabt, aber können auch explizit in Migrationen definiert werden).

---

## 4. Akzeptanzkriterien

*   Das `Player`-Modell enthält die neuen Felder `current_map`, `position_x`, `position_y`, `is_running`, `money`, `play_time`, `last_save`, `last_heal`.
*   Die neuen Dateien `server/models/Progress.js` und `server/models/Achievement.js` existieren und enthalten die korrekten Modelldefinitionen.
*   Die neuen Modelle `Progress` und `Achievement` sind in `server/models/index.js` importiert und initialisiert.
*   Die `hasMany`/`belongsTo`-Assoziationen zwischen `Player`, `Progress` und `Achievement` sind in `server/models/index.js` korrekt definiert, inklusive `onDelete: 'CASCADE'`.
*   Der Server startet ohne Fehler bezüglich der Modelldefinitionen oder Assoziationen.
*   **(Wenn Migrationen verwendet werden)** Die Migrationen lassen sich erfolgreich ausführen (`sequelize db:migrate`) und rückgängig machen (`sequelize db:migrate:undo`).
*   **(Alternativ, im Entwicklungsmodus)** Ein `sequelize.sync({ force: true })` erstellt die neuen Tabellen und Spalten korrekt in der Datenbank.
*   Das Mermaid-Diagramm in diesem Dokument spiegelt die implementierten Modelle korrekt wider.

---

## 5. Zusätzliche Empfehlungen & Best Practices

### 5.1. Datenbank-Migrationen

*   **Warum:** Statt `sequelize.sync({ force: true })` (was im Produktivbetrieb gefährlich ist, da es Daten löscht) sollten **Sequelize-Migrationen** verwendet werden, um Änderungen an der Datenbankstruktur kontrolliert, versioniert und nachvollziehbar anzuwenden.
*   **Vorgehen:**
    *   Installiere die `sequelize-cli`, falls noch nicht geschehen (`npm install --save-dev sequelize-cli`).
    *   Initialisiere Sequelize für die CLI (`npx sequelize-cli init`), falls noch nicht geschehen.
    *   Erstelle Migrationen für jede Änderung:
        *   `npx sequelize-cli migration:generate --name add-gamestate-fields-to-player`
        *   `npx sequelize-cli migration:generate --name create-progress-table`
        *   `npx sequelize-cli migration:generate --name create-achievement-table`
    *   Fülle die `up`- und `down`-Funktionen in den generierten Migrationsdateien mit den entsprechenden `queryInterface`-Methoden (z.B. `addColumn`, `createTable`, `addIndex`, `removeColumn`, `dropTable`, `removeIndex`).
    *   Führe die Migrationen aus mit `npx sequelize-cli db:migrate`.

### 5.2. Validierung & Constraints

*   **Warum:** Um die Datenintegrität auf Anwendungsebene sicherzustellen und ungültige Daten zu verhindern, bevor sie in die Datenbank gelangen.
*   **Beispiele (in den Modelldefinitionen hinzufügen):**
    *   `Player.money`: `validate: { min: 0 }` (um negatives Geld zu verhindern).
    *   `Player.position_x`, `Player.position_y`: Validierung, um sicherzustellen, dass die Koordinaten innerhalb der Grenzen der `current_map` liegen. Die Kartendaten sollten in einer separaten JSON-Datei oder Tabelle gespeichert werden.

        **Beispielimplementierung:**
        ```javascript
        const maps = require('../data/maps.json'); // Beispiel: JSON-Datei mit Karteninformationen

        Player.beforeValidate((player) => {
          const map = maps[player.current_map];
          if (!map) {
            throw new Error(`Ungültige Karte: ${player.current_map}`);
          }
          if (player.position_x < map.min_x || player.position_x > map.max_x ||
              player.position_y < map.min_y || player.position_y > map.max_y) {
            throw new Error(`Position (${player.position_x}, ${player.position_y}) liegt außerhalb der Grenzen der Karte ${player.current_map}`);
          }
        });
        ```
        **Hinweis:** Alternativ könnte eine relationale Datenbankabfrage verwendet werden, wenn Kartendaten in einer Tabelle gespeichert sind.
    *   `Progress.quest_key`, `Achievement.achievement_key`: `validate: { isIn: [['quest1_key', 'quest2_key', ...]] }` (um sicherzustellen, dass nur gültige Schlüssel verwendet werden; die Liste der gültigen Schlüssel muss verwaltet werden).
    *   `Progress.status`: Das `ENUM` bietet bereits eine grundlegende Validierung.
    *   Prüfung auf bereits vorhandene E-Mail-Adresse bei der Registrierung (unique constraint).
    *   Validierung der Passwortstärke (Mindestlänge, Komplexität).
    *   ggf. Validierung der `role` (falls es ein Enum ist).
*   **Hinweis:** Datenbank-Constraint-Verletzungen (unique, allowNull) müssen im Controller abgefangen und in sinnvolle Client-Fehlermeldungen übersetzt werden.

### 5.3. Leistungsoptimierung (Zusätzliche Indizes)

*   **Warum:** Um häufige Abfragen zu beschleunigen.
*   **Potenzielle Kandidaten (zusätzlich zu den bereits definierten):**
    *   `Player.current_map`: Wenn häufig nach allen Spielern auf einer bestimmten Karte gesucht wird.
        ```javascript
        // In Player Model Optionen:
        indexes: [ { fields: ['current_map'] } ]
        ```
    *   `Progress.status`: Wenn häufig nach Quests mit einem bestimmten Status gesucht wird (z.B. alle 'in_progress').
        ```javascript
        // In Progress Model Optionen (zusätzlich zum unique Index):
        indexes: [
          { unique: true, fields: ['player_id', 'quest_key'] },
          { fields: ['status'] } // Neuer Index
        ]
        ```
*   **Hinweis:** Das Hinzufügen von Indizes sollte datengetrieben erfolgen. Analysiere Abfragemuster und führe Tests mit realistischen Datenmengen durch. Nutze Tools wie den Query-Analyzer von PostgreSQL/MySQL, um festzustellen, ob ein Index auf `Progress.status` tatsächlich einen Performancegewinn bringt. Füge Indizes nur hinzu, wenn sie für erwartete Abfragemuster sinnvoll sind.

### 5.4. Transaktionssicherheit

*   **Warum:** Wenn eine einzelne Benutzeraktion mehrere Datenbankänderungen erfordert (z.B. Quest abschließen, Belohnung geben, Achievement freischalten), sollten diese Änderungen atomar erfolgen. Entweder alle erfolgreich oder keine.
*   **Vorgehen:** Verwende Sequelize-Transaktionen für solche Operationen.

    **Beispiel für eine robuste Transaktion mit Sequelize:**
    ```javascript
    const sequelize = require('../models').sequelize;

    async function completeQuest(playerId, questKey) {
      const transaction = await sequelize.transaction();
      
      try {
        const progress = await Progress.findOne({ where: { player_id: playerId, quest_key: questKey }, transaction });
        if (!progress || progress.status !== 'in_progress') {
          throw new Error('Quest nicht gefunden oder nicht in Bearbeitung');
        }

        progress.status = 'completed';
        progress.completed_at = new Date();
        await progress.save({ transaction });

        await Achievement.create({
          player_id: playerId,
          achievement_key: `${questKey}_completed`
        }, { transaction });

        await transaction.commit();
        console.log('Quest abgeschlossen!');
        
      } catch (error) {
        await transaction.rollback();
        console.error('Fehler bei der Quest-Abschluss-Transaktion:', error.message);
        
        if (error instanceof Sequelize.ValidationError) {
          console.error('Validierungsfehler:', error.errors);
        } else if (error.message.includes('Datenbank')) {
          console.error('Datenbankverbindungsfehler:', error);
        }
        
        throw error; // Fehler weiterwerfen
      }
    }
    ```
*   **Hinweis:** Transaktionen sollten auch bei der Registrierung verwendet werden, um sicherzustellen, dass alle Schritte (Benutzer erstellen, Profil erstellen, etc.) atomar erfolgen.

### 5.5. Seed-Daten für Entwicklung und Tests

Seed-Daten sind essenziell für Tests und Entwicklung.

**Empfehlung:** Nutze Sequelize-Seeders:

```javascript
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Maps', [
      { id: 'starter_town', min_x: 0, max_x: 100, min_y: 0, max_y: 100 },
      { id: 'forest', min_x: -50, max_x: 50, min_y: -50, max_y: 100 },
    ]);

    await queryInterface.bulkInsert('Achievements', [
      { achievement_key: 'caught_10_pokemon', description: 'Fange zehn Pokémon!' },
      { achievement_key: 'beat_elite_four', description: 'Besiege die Top Vier!' },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Maps', null);
    await queryInterface.bulkDelete('Achievements', null);
  }
};
```

Weitere Empfehlungen und Best Practices zur Datenmodellierung finden Sie in [tickets\gamestate_management\refined\PTB_GS01_Datenmodellierungs_BestPractices.md](tickets\gamestate_management\refined\PTB_GS01_Datenmodellierungs_BestPractices.md).
