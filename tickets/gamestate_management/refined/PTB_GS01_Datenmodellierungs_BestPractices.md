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

### 5.6. Sicherheitshinweise

*   **Abhängigkeitsmanagement (bcrypt vs. bcryptjs):** bcrypt benötigt native C++-Kompilierung und kann in manchen Umgebungen zu Problemen führen. bcryptjs ist eine reine JS-Alternative, aber deutlich langsamer. Die Wahl sollte bewusst getroffen werden, abhängig von Deployment-Umgebung und Performance-Anforderungen.
*   **Hook-Logik und Asynchronität:** Fehlende await-Aufrufe bei bcrypt.hash/compare führen zu fehlerhafter Verarbeitung. Die Prüfung auf player.changed('password_hash') ist bei beforeUpdate wichtig, um unnötiges Re-Hashing zu vermeiden. Doppel-Hashing vermeiden: Prüfen, ob bereits ein Hash übergeben wird. Korrekte Validierungsreihenfolge: allowNull: false-Constraints können Hooks verhindern, wenn kein Wert gesetzt ist. Richtiger Datenzugriff im Hook (z.B. Tippfehler vermeiden, ggf. getDataValue nutzen).
*   **Performance:** Zu hohe SALT_ROUNDS verlangsamen Registrierung/Passwortänderung. Benchmarking ist wichtig.
*   **Bulk-Operationen:** Bulk-Operationen (bulkCreate, bulkUpdate) umgehen Hooks, wenn keine Bulk-Hooks oder individualHooks: true gesetzt sind. Gefahr: Passwörter werden im Klartext gespeichert.
*   **Best Practices für das Player-Modell:** Felder: email, password_hash, role, is_active, last_login. Passwort-Hashing über Sequelize Hooks (beforeCreate, beforeUpdate) mit bcrypt. Instanzmethode checkPassword für Passwortvergleich. Angemessener Cost Factor, robuste Validierung, korrekte Hook-Implementierung, Scopes gegen Hash-Leaks.

### 5.7. Inventarverwaltung

Inventare lassen sich unterschiedlich modellieren, je nachdem ob Items instanziiert werden oder nur als Referenz zählen. Für einzigartige Gegenstände (z.B. ein bestimmtes Schwert mit individueller ID) ist eine eigene Items-Tabelle sinnvoll, die alle Item-Instanzen enthält und per playerId (One-to-Many) oder via Join-Tabelle PlayerItems (Many-to-Many, falls ein Item handelbar ist zwischen Spielern) dem Besitzer zugeordnet wird. Letzteres Muster erlaubt auch, ein Feld wie quantity in PlayerItems zu haben, falls man stapelbare Items hat. Für nicht einzigartige Items (z.B. Goldmünzen) kann man auch im Player einen simplen Integer-Wert halten. Das Sandbox-Beispiel oben zeigt einen anderen Ansatz: ein Inventar als eigenständiges Modell, das dann wiederum Items beinhaltet – das eignet sich, wenn man Inventare auch losgelöst vom Spieler betrachten möchte (z.B. gemeinsame Team-Truhe). Best Practice: Halte die Inventarstruktur so normalisiert wie nötig – ein häufiger Fehler ist es, alle Item-IDs als Array in einem JSON-Feld im Spieler zu speichern. Das macht Abfragen (z.B. „wer besitzt Item X?“) und Updates unnötig schwer. Besser ist eine relationale Zuordnung mit Proper Foreign Keys, die auch die Möglichkeit offen hält, später z.B. ein Auktionshaus (wo Items keinem Spieler gehören) ins Modell einzufügen.

### 5.8. Event-Logging

In Multiplayer-Spielen fallen oft Events oder Logs an (Kämpfe, Chat-Nachrichten, Handelsaktionen etc.), die man historisch speichern möchte. Ein Logging-System sollte die Performance der Kerndatenbank nicht beeinträchtigen. Überlege, Events in einer separaten Tabelle zu halten, eventuell sogar in einer separaten Datenbank oder einem NoSQL-Store, wenn die Menge groß wird. Wenn man Sequelize dafür nutzt, kann ein einfaches Model EventLog mit Feldern type, playerId (optional, wer beteiligt), data (JSON für Details) und createdAt ausreichen. Durch geeignete Indizes (z.B. auf playerId und type) kann man später Analysen fahren („Zeige alle trade-Events des Spielers X“). Für sehr viele Logs ist Bulk-Insert hilfreich (z.B. immer 100 Logs auf einmal schreiben). Man kann auch asynchron loggen: Das Spiel verarbeitet Aktionen zunächst in Memory und stößt Logs in eine Warteschlange, die ein Worker dann periodisch in die DB commitet – so bleibt die Latenz niedrig. Tipp: Überlegt euch, welche Logs wirklich dauerhaft gebraucht werden (viele Spiele loggen alles, was schnell Millionen Zeilen ergibt). Evtl. alte Logs archivieren oder löschen, oder auf ein Data Warehouse verschieben.

### 5.9. Multiplayer-spezifische Modelle

Bei echten Multiplayer-Spielen kommen noch weitere Entitäten ins Spiel, z.B. Lobby/Raum, Matchmaking, Ranglisten usw. Diese lassen sich mit den gleichen Mitteln modellieren. Eine Lobby könnte z.B. ein Model Room sein, das hasMany(Player) (Teilnehmer) und ggf. hasMany(Message) (Chatnachrichten). Für Matchmaking könnte man eine Match-Tabelle haben, die via Join-Tabellen die beteiligten Spieler referenziert. Wichtig ist hier vor allem, auf Transaktionen zu setzen, wenn mehrere Spieler-Datensätze gleichzeitig geändert werden (z.B. bei einem Tauschhandel beide Inventare und Kontostände zusammen updaten, oder bei Kampfende Sieger- und Verlierer-Stats in einer Transaktion schreiben). Sequelize unterstützt Transaktionen out-of-the-box und kann sogar optimistische Sperren nutzen, falls nötig. Für Ranglisten (Leaderboards) kann man regelmäßig aggregierte Werte berechnen und in einer Leaderboard-Tabelle halten, um teure ORDER BY-Queries auf vielen Spielern zu vermeiden – quasi wieder ein Fall von gezielter Denormalisierung für Performance.

Zusammenfassend lässt sich sagen, dass Sequelize als ORM alle nötigen Werkzeuge bietet, um auch komplexe Spieldatenmodelle abzubilden – von klassischen relationalen Beziehungen über JSON-Felder bis zu Transaktionen und (mit externer Hilfe) Caching. Wichtig ist, die Datenbankstruktur sauber zu durchdenken: Normalisiert wo möglich, indexiert klug, und nutzt die Abstraktionen von Sequelize, um eure Spiel-Logik übersichtlich und wartbar zu halten. Konkrete Open-Source-Projekte wie das erwähnte Havoc oder kleinere Beispielprojekte können dabei als Inspiration dienen und zeigen, wie man theoretische Best Practices in der Praxis umsetzt. Mit diesen Leitlinien sollte es gelingen, ein performantes und gut wartbares Datenmodell für euer Spiel zu gestalten, das auch Wachstum und neuen Features standhält.

**Quellen:** Die obigen Empfehlungen basieren auf der offiziellen Sequelize-Dokumentation, allgemeinen Datenbank-Prinzipien sowie Erfahrungen aus Blog-Beiträgen und Open-Source-Projekten (siehe referenzierte Quellen). Beispielsweise erläutern Matabaro und StudyRaid wichtige Performance-Tipps, während die Sequelize-Dokumentation Details zu Associations und Polymorphie liefert. Die genannten Projekte Sequelize Sandbox und Havoc veranschaulichen die Umsetzung im Gaming-Bereich.