mplementierungsplan für Ticket 0002: Anpassung des Player-Modells im Projekt PokeTogetherBrowser
1. Einleitung
Zielsetzung des Tickets:
Dieses Dokument beschreibt den detaillierten Plan zur Umsetzung von Ticket 0002 im Rahmen des PokeTogetherBrowser-Projekts. Die Kernaufgabe besteht in der Modifikation des zentralen Sequelize-Datenmodells für Spieler, definiert in server/models/Player.js. Ziel ist es, das Modell an die Anforderungen der geplanten JWT/Cookie-basierten Authentifizierung und der Projektdokumentation anzupassen. Dies umfasst das Hinzufügen neuer Felder, die Implementierung von sicherem Passwort-Hashing mittels bcrypt und Sequelize Hooks sowie die Bereitstellung einer Methode zur Passwortverifizierung.

Bedeutung im Projektkontext:
Die korrekte und sichere Verwaltung von Spielerdaten ist fundamental für PokeTogetherBrowser. Die Anpassungen im Player-Modell stellen eine entscheidende Grundlage für die nachfolgende Implementierung von sicheren Registrierungs- und Login-Funktionalitäten dar. Aktuell besteht eine signifikante Diskrepanz zwischen der detaillierten Dokumentation, die ein robustes JWT/Cookie-System vorsieht, und dem implementierten Code, der ein einfaches Session-Management nutzt. Dieses Ticket adressiert einen Teil dieser Diskrepanz, indem es das Datenmodell für die sichere Handhabung von Zugangsdaten vorbereitet. Ein korrekt konfiguriertes Modell mit zuverlässigem Passwort-Hashing ist essentiell, um darauf aufbauende Features wie Spielstandspeicherung, Inventarverwaltung und Interaktionen sicher zu gestalten.

Struktur des Berichts:
Dieser Bericht gliedert sich wie folgt: Zunächst werden die notwendigen Anpassungen an den Felddefinitionen des Player-Modells detailliert beschrieben. Anschließend wird die Implementierung des automatischen Passwort-Hashings mithilfe von Sequelize Hooks erläutert. Darauf folgt die Beschreibung der Implementierung einer Instanzmethode zur Passwortverifizierung. Ein Abschnitt präsentiert das vollständige Code-Konstrukt für die Modelldatei mit Erklärungen. Schließlich werden Best Practices, wichtige Überlegungen sowie potenzielle Probleme und Risiken bei der Umsetzung diskutiert, bevor der Bericht mit einer Zusammenfassung und den nächsten Schritten abschließt.

2. Anpassung des Player-Modells (server/models/Player.js)
Die Anpassung des Player-Modells ist der erste Schritt zur Implementierung des neuen Authentifizierungssystems. Es müssen Felder hinzugefügt oder modifiziert werden, um zusätzliche Benutzerinformationen zu speichern und die sichere Handhabung von Passwörtern zu ermöglichen.

Notwendige Felddefinitionen:

Die sequelize.define('Player', {... })-Definition in server/models/Player.js muss überprüft und um die folgenden Felder erweitert bzw. angepasst werden :   

email:

Typ: DataTypes.STRING(100)    
allowNull: true (oder false, falls eine E-Mail verpflichtend sein soll). allowNull: false setzt auf SQL-Ebene ein NOT NULL-Constraint und führt auf Sequelize-Ebene eine Validierung durch.   
unique: true oder { msg: 'Diese E-Mail-Adresse wird bereits verwendet.' }. Dies erstellt einen Unique Index in der Datenbank, um sicherzustellen, dass jede E-Mail nur einmal vorkommt. Eine Verletzung führt zu einem SequelizeUniqueConstraintError.   
validate: { isEmail: { msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' } }. Sequelize-Validatoren prüfen das Format auf Anwendungsebene (JavaScript), bevor eine SQL-Abfrage gesendet wird. isEmail prüft auf ein gültiges E-Mail-Format.   
Zweck: Ermöglicht optional die Registrierung/Passwort-Reset per E-Mail und dient als eindeutiger Identifikator neben dem Benutzernamen.
password_hash:

Typ: DataTypes.STRING(255). Bcrypt-Hashes haben typischerweise eine Länge von 60 Zeichen, ein größerer Puffer ist jedoch empfehlenswert.   
allowNull: false. Dies stellt sicher, dass kein Spieler ohne Passwort-Hash (bzw. das temporär darin gespeicherte Klartextpasswort vor dem Hashing) erstellt werden kann.
Wichtige Überlegung zur Validierungsreihenfolge: Sequelize führt Validierungen (wie allowNull: false) vor den beforeCreate-Hooks aus. Das bedeutet, wenn beim Aufruf von Player.create kein Wert für password_hash übergeben wird, schlägt die Validierung fehl, bevor der Hook die Chance hat, den Hash zu generieren. Das im Ticket beschriebene Vorgehen, das Klartextpasswort temporär im password_hash-Feld zu übergeben, umgeht dieses Problem, da das Feld zum Zeitpunkt der Validierung nicht null ist. Dies erfordert jedoch, dass der aufrufende Controller-Code konsequent das Klartextpasswort in diesem Feld bereitstellt. Eine Alternative wäre, allowNull: true zu setzen (was den Datenbank-Constraint aufweicht) oder den Hook zu beforeValidate zu ändern. Die im Ticket gewählte Methode ist funktional, bedarf aber sorgfältiger Implementierung im Controller.   
Zweck: Speicherung des sicheren Passwort-Hashes.
role:

Typ: DataTypes.STRING(20)
allowNull: false
defaultValue: 'player'. Legt die Standardrolle für neu registrierte Benutzer fest.   
validate: { isIn: { args: [['player', 'moderator', 'admin']], msg: 'Ungültige Benutzerrolle.' } }. Beschränkt die erlaubten Werte für dieses Feld auf die definierten Rollen.   
Zweck: Ermöglicht die Implementierung von rollenbasierten Berechtigungen im Spiel.
is_active:

Typ: DataTypes.BOOLEAN    
allowNull: false
defaultValue: true
Zweck: Ermöglicht das administrative Deaktivieren von Spieler-Accounts, ohne sie zu löschen.
last_login:

Typ: DataTypes.DATE    
allowNull: true (Ein neuer Spieler hat noch keinen last_login-Zeitpunkt).
Zweck: Speichert den Zeitstempel des letzten erfolgreichen Logins.
Bestehende Felder wie id, username, position_x, position_y, is_running etc. sollten gemäß den bisherigen Anforderungen erhalten bleiben.

Unterscheidung Validierung vs. Constraints:
Es ist wichtig, den Unterschied zwischen Sequelize-Validierungen und Datenbank-Constraints zu verstehen :   

Validierungen (validate): Werden auf der Anwendungsebene (in JavaScript durch Sequelize) ausgeführt, bevor eine SQL-Abfrage an die Datenbank gesendet wird. Sie können komplexe Logik enthalten. Bei Fehlschlag wird keine Datenbankaktion ausgeführt.
Constraints (allowNull, unique, primaryKey, Foreign Keys): Werden auf der SQL-Datenbankebene definiert und durchgesetzt. Eine SQL-Abfrage wird ausgeführt, und bei einer Verletzung wirft die Datenbank einen Fehler, den Sequelize weiterleitet (z.B. SequelizeUniqueConstraintError).
Durch die Kombination beider Mechanismen wird die Datenintegrität auf mehreren Ebenen sichergestellt.

Tabelle 1: Angepasste Felder im Player-Modell

Feldname	Datentyp (Sequelize)	Constraints (allowNull, unique)	Standardwert (defaultValue)	Validierung (validate)	Zweck/Beschreibung
email	DataTypes.STRING(100)	allowNull: true/false, unique: true	-	isEmail: true	Eindeutige E-Mail-Adresse des Spielers (optional oder Pflicht)
password_hash	DataTypes.STRING(255)	allowNull: false	-	-	Speichert den sicheren bcrypt-Hash des Passworts
role	DataTypes.STRING(20)	allowNull: false	'player'	isIn: [['player', 'moderator', 'admin']]	Benutzerrolle zur Rechteverwaltung (Standard: 'player')
is_active	DataTypes.BOOLEAN	allowNull: false	true	-	Flag, ob der Account aktiv ist (Standard: true)
last_login	DataTypes.DATE	allowNull: true	-	-	Zeitstempel des letzten erfolgreichen Logins
(bestehende)	(wie bisher)	(wie bisher)	(wie bisher)	(wie bisher)	(wie bisher)

In Google Sheets exportieren
3. Implementierung des Passwort-Hashings
Die sichere Speicherung von Passwörtern ist unerlässlich. Anstatt Klartextpasswörter zu speichern, werden Hashes verwendet, die mit bcrypt generiert werden. Sequelize Hooks bieten einen eleganten Weg, diesen Hashing-Prozess automatisch bei der Erstellung und Aktualisierung von Spielerdaten durchzuführen.   

Sequelize Hooks für automatisiertes Hashing:

Hooks sind Funktionen, die automatisch vor oder nach bestimmten Sequelize-Operationen (Lifecycle Events) ausgeführt werden. Für das Passwort-Hashing sind die Hooks beforeCreate und beforeUpdate relevant. Sie werden innerhalb des options-Objekts von sequelize.define deklariert.   

beforeCreate-Hook:

Zweck: Wird unmittelbar vor dem Speichern eines neuen Spieler-Eintrags in der Datenbank ausgeführt.
Implementierung:
JavaScript

hooks: {
  beforeCreate: async (player, options) => {
    if (player.password_hash) { // Stellt sicher, dass ein Passwortwert übergeben wurde
      const SALT_ROUNDS = 10; // Oder aus Konfiguration laden
      player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
    }
  },
  //... beforeUpdate Hook
}
Erklärung:
Die Funktion muss async sein, da bcrypt.hash eine asynchrone Operation ist und await verwendet wird, um auf das Ergebnis zu warten.   
Das player-Argument repräsentiert die Model-Instanz, die gerade erstellt wird. Änderungen an diesem Objekt werden direkt übernommen, da es per Referenz übergeben wird.   
bcrypt.hash nimmt das Klartextpasswort (das temporär in player.password_hash steht) und die Anzahl der Salt-Runden entgegen. Es generiert automatisch einen zufälligen Salt, führt das Hashing durch und gibt den vollständigen Hash-String zurück (inklusive Salt und Cost Factor). Dieser Hash überschreibt den ursprünglichen Klartextwert im player-Objekt.   
beforeUpdate-Hook:

Zweck: Wird unmittelbar vor dem Speichern von Änderungen an einem bestehenden Spieler-Eintrags ausgeführt. Dies ist wichtig, wenn ein Benutzer sein Passwort ändert.
Implementierung:
JavaScript

hooks: {
  //... beforeCreate Hook
  beforeUpdate: async (player, options) => {
    // Prüfen, ob das Feld 'password_hash' explizit geändert wurde
    if (player.changed('password_hash') && player.password_hash) {
      // Zusätzliche Sicherheitsprüfung: Nur hashen, wenn der neue Wert kein bcrypt-Hash ist
      // Verhindert versehentliches Doppel-Hashing
      if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
        const SALT_ROUNDS = 10; // Oder aus Konfiguration laden
        player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
      } else {
          // Optional: Warnung loggen, falls versucht wird, einen bereits gehashten Wert zu setzen
          console.warn(`Attempt to set an already hashed value for Player ID ${player.id}. Skipping hash.`);
      }
    }
  }
}
Erklärung:
Auch diese Funktion muss async sein.
player.changed('password_hash'): Diese Sequelize-Instanzmethode  prüft, ob der Wert des Feldes password_hash seit dem Laden der Instanz oder dem letzten Speichern geändert wurde. Dies ist entscheidend, um sicherzustellen, dass das Passwort nur dann neu gehasht wird, wenn es tatsächlich geändert wurde, und nicht bei jeder anderen Aktualisierung des Spielerprofils (z.B. Positionsänderung).   
!player.password_hash.match(/^\$2[aby]\$\d{2}\$/): Diese zusätzliche Regex-Prüfung  stellt sicher, dass nicht versucht wird, einen bereits existierenden bcrypt-Hash erneut zu hashen. Dies ist eine wichtige Absicherung gegen Logikfehler im Controller, die möglicherweise bereits einen Hash an das Update übergeben.   
Integration von bcrypt:

Installation: Das bcrypt-Paket muss im Projekt installiert sein (npm install bcrypt oder yarn add bcrypt).
Import: const bcrypt = require('bcrypt'); am Anfang der Modelldatei.
Salt Rounds: Eine Konstante const SALT_ROUNDS = 10; (oder ein anderer Wert, siehe Best Practices) sollte definiert werden, um die Rechenintensität des Hashings festzulegen.
Wichtige Überlegungen zu Hooks:

Asynchronität und Performance: Asynchrone Hooks werden nacheinander (seriell) ausgeführt. Jeder Hook muss abgeschlossen sein (sein Promise muss resolven), bevor der nächste ausgeführt wird. Langlaufende Operationen in Hooks, wie das bcrypt-Hashing mit einem hohen Cost Factor, können die Gesamtdauer der Datenbankoperation (z.B. create, update) verlängern.   
Geltungsbereich der Hooks und Bulk-Operationen: Die hier definierten Hooks (beforeCreate, beforeUpdate) sind Instanz-Hooks. Sie werden nur ausgelöst, wenn einzelne Model-Instanzen erstellt oder geändert werden (z.B. durch Model.create(), instance.save(), instance.update()). Sie greifen nicht standardmäßig bei Bulk-Operationen wie Model.bulkCreate([...]) oder Model.update({... }, { where:... }). Sequelize führt bei Bulk-Operationen aus Performancegründen oft direkte SQL-Queries aus, die die Instanz-Hooks umgehen.
Konsequenz: Wenn im Projekt Bulk-Operationen verwendet werden (z.B. für das Seeding von Testdaten, administrative Massenänderungen), wird die Passwort-Hashing-Logik in diesen Hooks nicht angewendet, was zu unsicheren (Klartext-)Passwörtern in der Datenbank führen kann.
Lösungsansätze:
Vermeiden von Bulk-Operationen für Benutzerdaten, bei denen Passwörter involviert sind.
Verwendung der Option { individualHooks: true } bei Bulk-Aufrufen. Dies zwingt Sequelize, jede Instanz einzeln zu behandeln und die Instanz-Hooks auszuführen, was jedoch die Performance erheblich beeinträchtigen kann.   
Implementierung spezifischer Bulk-Hooks (beforeBulkCreate, beforeBulkUpdate). Diese Hooks erhalten die Daten als Array bzw. Options-Objekt und müssen die Hashing-Logik explizit für jeden Datensatz in einer Schleife anwenden.   
Empfehlung: Es muss geprüft werden, ob Bulk-Operationen für das Player-Modell relevant sind. Falls ja, ist die Implementierung dedizierter Bulk-Hooks (beforeBulkCreate, beforeBulkUpdate) zur Sicherstellung des Passwort-Hashings dringend zu empfehlen.
  
4. Implementierung der Passwort-Verifizierung
Nachdem Passwörter sicher gehasht gespeichert werden, wird eine Methode benötigt, um ein vom Benutzer eingegebenes Login-Passwort mit dem gespeicherten Hash zu vergleichen. Eine Instanzmethode auf dem Player-Modell ist hierfür der geeignete Ort, um die Logik zu kapseln.   

Notwendigkeit einer Instanzmethode:
Instanzmethoden sind Funktionen, die auf einer spezifischen Instanz eines Modells operieren (d.h. auf einem einzelnen Spielerdatensatz). Sie haben Zugriff auf die Daten dieser Instanz über this. Durch das Hinzufügen einer checkPassword-Methode zum Player-Modell wird die Funktionalität zum Passwortvergleich direkt an das Spielerobjekt gebunden, was den Code in den Controllern sauberer und wiederverwendbarer macht.

Hinzufügen der checkPassword-Methode:

Die Methode wird dem Prototyp des Modells hinzugefügt. Dies ist die Standardvorgehensweise in Sequelize, insbesondere seit Version 4.   

Syntax: Die Definition erfolgt nach sequelize.define(...), aber vor return Player;.
JavaScript

// Nach der sequelize.define(...) Klammer
Player.prototype.checkPassword = async function(password) {
  // Implementierung hier
};
// Vor return Player;
Asynchronität: Die Methode muss async deklariert werden, da die verwendete bcrypt.compare-Funktion asynchron ist und mit await aufgerufen werden muss.
Zugriff auf Hash: Innerhalb der Methode kann über this.password_hash auf den in der Datenbank gespeicherten Hash der aktuellen Spielerinstanz zugegriffen werden.
Verwendung von bcrypt.compare:

Die Kernlogik der Methode besteht im Aufruf von bcrypt.compare.

Implementierung:
JavaScript

Player.prototype.checkPassword = async function(password) {
  if (!password ||!this.password_hash) {
    // Kann nicht vergleichen, wenn Eingabe oder Hash fehlt
    return false;
  }
  try {
    // bcrypt.compare führt das Hashing des Klartextpassworts mit dem Salt aus dem Hash durch
    // und vergleicht das Ergebnis mit dem gespeicherten Hash.
    return await bcrypt.compare(password, this.password_hash);
  } catch (error) {
    // Fehler beim Vergleich loggen (optional, aber empfohlen für Debugging)
    console.error("Error comparing password:", error);
    return false;
  }
};
Funktionsweise: bcrypt.compare nimmt zwei Argumente: das vom Benutzer eingegebene Klartextpasswort und den aus der Datenbank geladenen Hash (this.password_hash). Die Funktion extrahiert automatisch den Salt und den Cost Factor, die im Hash-String gespeichert sind. Sie hasht dann das eingegebene Klartextpasswort unter Verwendung dieses Salts und Cost Factors. Schließlich vergleicht sie das Ergebnis dieses Hashings mit dem gespeicherten Hash. Sie gibt true zurück, wenn sie übereinstimmen, andernfalls false. Es ist wichtig zu verstehen, dass bcrypt.compare nicht zwei Hashes miteinander vergleicht.   
Fehlerbehandlung/Robustheit:
Die Methode sollte robust gegen fehlende Eingaben sein. Die Prüfung if (!password ||!this.password_hash) am Anfang stellt sicher, dass die Methode false zurückgibt, wenn entweder kein Passwort zum Vergleich übergeben wurde oder die Spielerinstanz keinen gespeicherten Hash hat (was nicht vorkommen sollte, wenn allowNull: false und die Hooks korrekt funktionieren, aber eine zusätzliche Absicherung ist). Ein try...catch-Block fängt potenzielle Fehler während des bcrypt.compare-Aufrufs ab.

5. Vollständiges Code-Konstrukt
Basierend auf den vorherigen Abschnitten ergibt sich folgendes vollständige Code-Konstrukt für die Datei server/models/Player.js. Es beinhaltet die notwendigen Imports, die Felddefinitionen, die Hooks für das Hashing und die Instanzmethode zur Verifizierung.

JavaScript

// server/models/Player.js

// Importiere notwendige Module
const { DataTypes, Model } = require('sequelize'); // Model ggf. importieren, falls die Class-Syntax verwendet wird
const bcrypt = require('bcrypt');

// Definiere den bcrypt Cost Factor als Konstante
// Ein Wert von 10-12 ist ein guter Kompromiss zwischen Sicherheit und Performance.
// Dieser Wert sollte idealerweise aus einer Konfigurationsdatei geladen werden.
const SALT_ROUNDS = 10;

module.exports = (sequelize) => {
  // Definiere das Player-Modell mit sequelize.define
  const Player = sequelize.define('Player', {
    // Primärschlüssel (angenommen, er existiert bereits oder wird hier definiert)
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    // Benutzername (angenommen, er existiert bereits)
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Dieser Benutzername ist bereits vergeben.'
      },
      validate: {
        notEmpty: { // Stellt sicher, dass der String nicht leer ist
          msg: 'Benutzername darf nicht leer sein.'
        },
        len: { // Beispiel: Mindest-/Maximallänge
          args: [3, 50],
          msg: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein.'
        }
      }
    },
    // NEU: E-Mail-Adresse
    email: {
      type: DataTypes.STRING(100),
      allowNull: true, // Auf false setzen, wenn E-Mail Pflicht sein soll
      unique: { // Stellt sicher, dass E-Mails eindeutig sind
        msg: 'Diese E-Mail-Adresse wird bereits verwendet.'
      },
      validate: {
        isEmail: { // Sequelize-Validierung für E-Mail-Format
          msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
        }
      }
    },
    // NEU/ANGEPASST: Passwort-Hash
    password_hash: {
      type: DataTypes.STRING(255), // Ausreichend für bcrypt-Hashes (typ. 60 Zeichen)
      allowNull: false // Wichtig: Controller muss Klartextpasswort hier übergeben!
    },
    // NEU: Benutzerrolle
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'player', // Standardrolle für neue Spieler
      allowNull: false,
      validate: {
        isIn: { // Erlaubte Rollen definieren
          args: [['player', 'moderator', 'admin']],
          msg: 'Ungültige Benutzerrolle.'
        }
      }
    },
    // NEU: Account-Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Standardmäßig aktiv
      allowNull: false
    },
    // NEU: Letzter Login-Zeitpunkt
    last_login: {
      type: DataTypes.DATE,
      allowNull: true // Ist null, bis der erste Login erfolgt
    },
    // Bestehende Felder (Beispiele, anpassen nach Bedarf)
    position_x: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    position_y: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    map_id: {
        type: DataTypes.STRING, // Oder INTEGER, je nach Map-ID-Format
        allowNull: false,
        defaultValue: 'default_map' // Beispiel
    },
    is_running: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
    // Weitere Felder wie Geld, Erfahrungspunkte etc. können hier hinzugefügt werden
  }, {
    // Optionen für das Modell
    timestamps: true, // Fügt createdAt und updatedAt automatisch hinzu (Standard) [1]
    underscored: true, // Konvertiert camelCase Feldnamen zu snake_case Spaltennamen (z.B. passwordHash -> password_hash)
    // freezeTableName: true, // Verhindert, dass Sequelize den Tabellennamen pluralisiert (Player -> player statt players) [1]

    // Sequelize Hooks für automatische Aktionen
    hooks: {
      // Hook vor dem Erstellen eines neuen Spielers
      beforeCreate: async (player, options) => {
        // Hashen des Passworts, wenn es gesetzt ist
        if (player.password_hash) {
          // Prüfen, ob es bereits ein Hash ist (Sicherheitsnetz)
          if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
             player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
          } else {
             // Sollte im Normalfall nicht passieren, da bei Create Klartext erwartet wird
             console.warn(`Attempted to hash an already hashed password during creation for user ${player.username}. Ensure plaintext password is provided.`);
          }
        } else {
           // Dies sollte aufgrund von allowNull:false nicht passieren, aber als Fallback
           throw new Error("Password cannot be empty.");
        }
      },
      // Hook vor dem Aktualisieren eines bestehenden Spielers
      beforeUpdate: async (player, options) => {
        // Nur ausführen, wenn das Feld 'password_hash' geändert wurde
        if (player.changed('password_hash') && player.password_hash) {
          // Zusätzliche Sicherheitsprüfung: Nur hashen, wenn der neue Wert kein bcrypt-Hash ist
          if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
            player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
          } else {
            // Optional: Loggen, dass ein bereits gehashter Wert übergeben wurde (kann auf Fehler im Controller hindeuten)
            console.warn(`Attempt to set an already hashed value during update for Player ID ${player.id}. Skipping hash.`);
            // Wichtig: Hier den Wert NICHT ändern, da er schon ein Hash ist.
            // Sequelize würde sonst versuchen, den Hash erneut zu speichern, was aber ok ist, da er sich nicht geändert hat.
            // Alternativ könnte man das Feld aus den zu speichernden Feldern entfernen, ist aber komplexer.
          }
        }
        // Hinweis: Wenn das Passwort auf null/leer gesetzt werden soll (was durch allowNull:false verhindert wird),
        // müsste hier zusätzliche Logik implementiert werden.
      }
      // Weitere Hooks (z.B. beforeValidate, afterCreate) können hier hinzugefügt werden [10, 12]
    },

    // Standard-Scope, um den Passwort-Hash standardmäßig NICHT bei Abfragen zurückzugeben [27]
    defaultScope: {
      attributes: { exclude: ['password_hash'] }
    },
    // Benannte Scopes, um den Hash gezielt abfragen zu können (z.B. für Login)
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] }
      }
      // Weitere Scopes für andere Anwendungsfälle (z.B. 'adminView')
    }
  });

  // Instanzmethode zum Vergleichen des eingegebenen Passworts mit dem gespeicherten Hash
  // Wird dem Prototyp hinzugefügt, um auf jeder Player-Instanz verfügbar zu sein [22, 23]
  Player.prototype.checkPassword = async function(password) {
    // Sicherstellen, dass ein Passwort zum Vergleich und ein Hash in der Instanz vorhanden sind
    if (!password ||!this.password_hash) {
      return false;
    }
    try {
      // bcrypt.compare vergleicht das Klartext-Passwort sicher mit dem Hash
      // Es extrahiert Salt und Cost Factor automatisch aus this.password_hash [7]
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      // Fehler beim Vergleich loggen (z.B. wenn der Hash korrupt ist)
      console.error(`Error comparing password for user ${this.username}:`, error);
      return false;
    }
  };

  // Assoziationen (Beispiel, falls vorhanden)
  // Player.associate = (models) => {
  //   Player.hasMany(models.PlayerPokemon, { foreignKey: 'player_id' });
  //   // Weitere Assoziationen...
  // };

  // Gib das definierte Modell zurück
  return Player;
};
6. Best Practices und Überlegungen
Bei der Implementierung der Modelländerungen und des Passwort-Handlings sollten folgende Best Practices und Überlegungen berücksichtigt werden:

Sichere Wahl des bcrypt Cost Factors (SALT_ROUNDS):

Bedeutung: Der Cost Factor (in bcrypt oft als saltRounds bezeichnet) bestimmt die Anzahl der Iterationen beim Hashing (genauer: 2<sup>Cost Factor</sup> Iterationen). Ein höherer Wert bedeutet exponentiell mehr Rechenaufwand.   
Trade-off: Ein höherer Cost Factor macht Brute-Force-Angriffe auf den Hash deutlich aufwändiger und somit das Passwort sicherer. Gleichzeitig verlängert er aber auch die Zeit, die der Server für das Hashing bei der Registrierung oder Passwortänderung benötigt. Die compare-Operation beim Login ist in der Regel schneller als das Hashing, wird aber ebenfalls durch einen höheren Cost Factor beeinflusst.   
Empfehlung: Ein Wert zwischen 10 und 12 ist aktuell (Stand 2025) ein gängiger und vernünftiger Startpunkt für viele Webanwendungen. 10 ist oft der Standardwert , während 12 bereits eine signifikant höhere Sicherheit bietet.   
Benchmarking: Es ist dringend empfohlen, die tatsächliche Hashing-Dauer auf der Ziel-Serverhardware zu messen. Ziel sollte eine Dauer sein, die für den Benutzer bei Registrierung/Passwortänderung noch akzeptabel ist (z.B. 100-500 Millisekunden), aber für Angreifer bereits eine signifikante Hürde darstellt.   
Management des Cost Factors: Hardware wird kontinuierlich schneller, wodurch Brute-Force-Angriffe auf Hashes mit einem festen Cost Factor über die Zeit einfacher werden. Da der Cost Factor Teil des gespeicherten Hash-Strings ist  und bcrypt.compare diesen Wert verwendet, führt eine einfache Erhöhung des SALT_ROUNDS-Wertes im Code dazu, dass neue Passwörter stärker gehasht werden, alte aber weiterhin mit dem alten Faktor verglichen werden können. Um die Sicherheit aller Accounts langfristig zu gewährleisten, sollte eine Strategie zur Migration implementiert werden. Ein gängiger Ansatz ist, beim erfolgreichen Login eines Benutzers zu prüfen, ob der Cost Factor seines Hashes unter dem aktuell gewünschten Wert liegt. Falls ja, wird das gerade erfolgreich validierte Passwort mit dem neuen Cost Factor neu gehasht und der alte Hash in der Datenbank ersetzt. Der SALT_ROUNDS-Wert sollte daher nicht fest im Code verdrahtet, sondern aus einer Konfigurationsdatei geladen werden, um spätere Anpassungen zu erleichtern.   
Tabelle 2: Beispielhafte bcrypt Cost Factors (Werte sind stark Hardware-abhängig!)

Cost Factor (N)	Iterationen (2^N)	Beispielhafte Dauer (ms)*	Relative Sicherheit (2025)	Anmerkung
8	256	< 50 ms	Minimum / Eher niedrig	Nur für sehr schwache Hardware oder Tests
10	1.024	~ 50 - 100 ms	Standard / Akzeptabel	Guter Startpunkt, verbreiteter Default
11	2.048	~ 100 - 200 ms	Gut	Merklich sicherer als 10
12	4.096	~ 200 - 400 ms	Stark	Empfohlen für gute Balance Sicherheit/Perf.
13	8.192	~ 400 - 800 ms	Sehr Stark	Kann für Benutzer spürbar langsamer sein
14	16.384	~ 800 - 1600 ms	Extrem Stark	Deutliche Latenz bei Registrierung/Änderung

In Google Sheets exportieren
* Die Zeitangaben sind Schätzungen und können je nach CPU-Leistung, Node.js-Version und bcrypt-Implementierung stark variieren. Unbedingt auf der Zielhardware testen!    

Robuste Validierung und Constraints:
Die konsequente Nutzung von Sequelize-Validatoren (validate.*) und Datenbank-Constraints (allowNull, unique) ist entscheidend für die Datenintegrität. Validatoren fangen Formatierungsfehler früh ab, während Constraints die Konsistenz auf Datenbankebene erzwingen.   

Korrekte Hook-Implementierung:
Die korrekte Implementierung der Hooks ist kritisch:

Immer async/await verwenden, wenn asynchrone Operationen wie bcrypt.hash aufgerufen werden.   
Im beforeUpdate-Hook unbedingt player.changed('password_hash') prüfen, um unnötiges Hashing zu vermeiden.   
Eine Prüfung auf bereits vorhandene Hashes im beforeUpdate-Hook (!player.password_hash.match(...)) verhindert Fehler durch versehentliches Doppel-Hashing.
Die Einschränkungen bezüglich Bulk-Operationen müssen beachtet und ggf. durch Bulk-Hooks oder { individualHooks: true } adressiert werden.   
Verhinderung von Passwort-Hash-Leaks:
Auch wenn der Passwort-Hash selbst sicher ist, sollte er niemals unnötig an den Client oder über API-Endpunkte preisgegeben werden.

Problem: Standard-Sequelize-Abfragen (findAll, findByPk, findOne) geben alle Modellattribute zurück, einschließlich password_hash, sofern nicht anders angegeben. API-Routen, die Spielerdaten zurückgeben (z.B. für Profilansichten oder Spielerlisten), könnten den Hash versehentlich leaken.
Lösung: Verwendung von Scopes in Sequelize.
defaultScope: Definieren Sie einen defaultScope, der das password_hash-Feld standardmäßig von allen Abfragen ausschließt (siehe Code-Beispiel oben). Dies ist die sicherste Variante, da der Hash nur dann zurückgegeben wird, wenn er explizit angefordert wird.
Benannte Scopes: Erstellen Sie einen spezifischen Scope (z.B. scopes: { withPassword: {} }), der keine Attribute ausschließt oder explizit den Hash inkludiert. Dieser Scope kann dann gezielt nur dort verwendet werden, wo der Hash tatsächlich benötigt wird – primär bei der Authentifizierung, um das Passwort mit checkPassword zu vergleichen (z.B. Player.scope('withPassword').findOne(...)).
Alternative: Überschreiben der .toJSON()-Methode des Modells, um den password_hash vor der Serialisierung zu entfernen. Dies wirkt sich global auf die JSON-Repräsentation aus, kann aber weniger flexibel als Scopes sein.   
  
Empfehlung: Die Verwendung von defaultScope zum Ausschluss und benannten Scopes zum gezielten Abruf des Hashes ist die robusteste Methode, um versehentliche Leaks zu verhindern.   
7. Mögliche Probleme und Risiken
Bei der Umsetzung von Ticket 0002 können verschiedene Probleme auftreten:

Abhängigkeitsprobleme (bcrypt): Das bcrypt-Paket benötigt native C++-Kompilierung. In manchen Deployment-Umgebungen kann dies zu Installationsproblemen führen. Eine Alternative ist bcryptjs, eine reine JavaScript-Implementierung. bcryptjs ist jedoch deutlich langsamer als bcrypt, was sich insbesondere bei höheren Cost Factors negativ auf die Performance auswirkt. Die Wahl sollte bewusst getroffen werden.   
Fehler in der Hook-Logik:
Asynchronität: Fehlende await-Aufrufe bei bcrypt.hash oder bcrypt.compare führen dazu, dass die Operation im Hintergrund läuft und das Ergebnis nicht korrekt verarbeitet wird, bevor die Hauptoperation (Speichern, Vergleichen) abgeschlossen ist.   
beforeUpdate-Logik: Das Vergessen der player.changed('password_hash')-Prüfung führt dazu, dass bei jeder Aktualisierung eines Spielers (z.B. Positionsänderung) das Passwort unnötigerweise neu gehasht wird, was die Serverlast erhöht.
Doppel-Hashing: Wenn die Prüfung auf bereits vorhandene Hashes (!player.password_hash.match(...)) fehlt oder fehlerhaft ist und der Controller versehentlich einen Hash übergibt, könnte dieser erneut gehasht werden. bcrypt.compare würde dann fehlschlagen.
Validierungsreihenfolge: Wie unter Punkt 2 diskutiert, können allowNull: false-Constraints die Ausführung von beforeCreate-Hooks verhindern, wenn kein initialer Wert übergeben wird.   
Datenzugriff: Falscher Zugriff auf Modelldaten innerhalb des Hooks (z.B. Tippfehler, user.password statt user.password_hash, oder die Notwendigkeit von user.getDataValue('password') in bestimmten Szenarien ) kann zu Fehlern führen.   
Datenbank-Constraint-Verletzungen: Wenn versucht wird, einen Spieler mit einer E-Mail oder einem Benutzernamen zu erstellen, die bereits existieren (unique Constraint), oder wenn ein allowNull: false-Feld nicht gesetzt wird, wirft die Datenbank bzw. Sequelize einen Fehler. Diese Fehler müssen im aufrufenden Controller-Code (z.B. in den Registrierungs- oder Update-Routen) abgefangen und in eine sinnvolle Fehlermeldung für den Client umgewandelt werden.   
Performance-Implikationen: Ein zu hoch gewählter SALT_ROUNDS-Wert kann die Antwortzeiten bei der Registrierung und Passwortänderung inakzeptabel verlängern. Dies kann die Benutzererfahrung negativ beeinflussen. Benchmarking ist hier unerlässlich.   
Nicht abgedeckte Bulk-Operationen: Das größte Risiko besteht darin, dass Bulk-Operationen (bulkCreate, bulkUpdate) im Projekt verwendet werden, ohne die entsprechenden Bulk-Hooks (beforeBulkCreate, beforeBulkUpdate) zu implementieren oder individualHooks: true zu verwenden. Dies würde dazu führen, dass die Hashing-Logik umgangen wird und Passwörter potenziell im Klartext oder gar nicht korrekt gespeichert werden.   
8. Zusammenfassung und nächste Schritte
Die Implementierung von Ticket 0002 gemäß diesem Plan passt das Player-Modell in server/models/Player.js umfassend an die Anforderungen einer sicheren Authentifizierung an. Es wurden die Felder email, password_hash, role, is_active und last_login hinzugefügt bzw. konfiguriert. Die automatische und sichere Speicherung von Passwort-Hashes wird durch die Implementierung der Sequelize Hooks beforeCreate und beforeUpdate unter Verwendung von bcrypt gewährleistet. Eine Instanzmethode checkPassword wurde hinzugefügt, um einen einfachen und gekapselten Mechanismus für den Passwortvergleich mittels bcrypt.compare bereitzustellen. Best Practices wie die Wahl eines angemessenen Cost Factors, robuste Validierung, korrekte Hook-Implementierung und die Verhinderung von Hash-Leaks durch Scopes wurden berücksichtigt.

Mit diesen Änderungen ist das Player-Modell nun technisch vorbereitet, um als Grundlage für die Implementierung der eigentlichen Authentifizierungslogik zu dienen.

Nächste Schritte:
Die nächsten logischen Schritte im Projekt, aufbauend auf diesem angepassten Modell, sind die Implementierung der zugehörigen API-Endpunkte:

Ticket 0003 (Registrierungs-Route): Erstellung einer neuen API-Route (z.B. POST /api/auth/register), die Benutzereingaben entgegennimmt, einen neuen Player-Eintrag mittels Player.create() erstellt (wobei der beforeCreate-Hook das Passwort hasht) und idealerweise ein JWT zurückgibt.
Ticket 0004 (Login-Route): Erstellung einer API-Route (z.B. POST /api/auth/login), die Benutzername/E-Mail und Passwort entgegennimmt, den Benutzer über einen Scope wie withPassword sucht, das eingegebene Passwort mit dem gespeicherten Hash über die player.checkPassword()-Methode vergleicht und bei Erfolg ein JWT generiert und als Cookie setzt.
Ticket 0005 (Authentifizierungs-Middleware): Implementierung einer Middleware, die eingehende Anfragen auf ein gültiges JWT prüft und den authentifizierten Benutzer dem Request-Objekt hinzufügt.
Diese Schritte werden die im Projektplan und der Dokumentation beschriebene JWT/Cookie-basierte Authentifizierung vervollständigen.