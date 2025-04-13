# Ticket 0002: Player Model anpassen

**Einleitung:**

Dieses Ticket befasst sich mit der Anpassung des zentralen Datenmodells für Spieler (`Player`) in der Datenbank (`server/models/Player.js`). Das Modell definiert, welche Informationen über jeden Spieler gespeichert werden (z.B. Benutzername, Passwort, Position). Wir müssen dieses Modell erweitern, um die neuen Anforderungen der JWT/Cookie-Authentifizierung zu unterstützen und sicherzustellen, dass Passwörter sicher gespeichert werden.

*   **Zweck der Änderungen:**
    *   **Neue Felder:** Wir fügen Felder wie `email` (für optionale E-Mail-Registrierung/Passwort-Reset), `role` (um zwischen normalen Spielern, Moderatoren, Admins zu unterscheiden) und `is_active` (um Accounts deaktivieren zu können) hinzu. Diese Felder ermöglichen erweiterte Benutzerverwaltung und Berechtigungsstufen.
    *   **Passwort-Hashing (Hooks):** Wir implementieren automatische "Hooks". Das sind Funktionen, die Sequelize automatisch ausführt, *bevor* ein Spieler in der Datenbank erstellt (`beforeCreate`) oder aktualisiert (`beforeUpdate`) wird. Diese Hooks nehmen das vom Benutzer eingegebene Klartext-Passwort (das temporär im `password_hash`-Feld steht) und wandeln es mithilfe von `bcrypt` in einen sicheren, nicht umkehrbaren Hash um. Nur dieser Hash wird gespeichert. Das Klartext-Passwort existiert somit nie in der Datenbank. Der `bcrypt`-Algorithmus fügt automatisch einen "Salt" hinzu, um Rainbow-Table-Angriffe zu erschweren. Die Zahl `10` im `bcrypt.hash`-Aufruf ist der "Cost Factor", der bestimmt, wie rechenintensiv das Hashing ist (höher ist sicherer, aber langsamer). 10-12 ist ein gängiger Wert.
    *   **Passwort-Vergleich (Methode):** Wir fügen eine Hilfsmethode (`checkPassword`) zum Player-Modell hinzu. Diese Methode wird beim Login aufgerufen. Sie nimmt das vom Benutzer eingegebene Klartext-Passwort entgegen und verwendet `bcrypt.compare`, um es sicher mit dem gespeicherten Hash in der Datenbank zu vergleichen. `bcrypt.compare` extrahiert den Salt aus dem Hash und führt den gleichen Hashing-Prozess durch, um das Ergebnis zu vergleichen.

Diese Anpassungen sind notwendig, damit der Server Benutzerdaten korrekt speichern und Passwörter sicher handhaben kann, was die Grundlage für die Login- und Registrierungsfunktionen in späteren Tickets bildet.

---

**Ziel:** Das Sequelize-Modell `Player` (`server/models/Player.js`) an die Anforderungen der JWT/Cookie-Authentifizierung und der Dokumentation anpassen.

**Abhängigkeiten:** Ticket 0001 (bcrypt sollte verfügbar sein)

**Aufgaben:**

1.  **Datei öffnen:** `server/models/Player.js`.
2.  **Imports sicherstellen:** Stelle sicher, dass `DataTypes` von `sequelize` und `bcrypt` importiert sind.
    ```javascript
    const { DataTypes } = require('sequelize');
    const bcrypt = require('bcrypt');
    const SALT_ROUNDS = 10; // Definiere den Cost Factor als Konstante
    ```
3.  **Felder prüfen/hinzufügen:** Überprüfe die `sequelize.define('Player', { ... })`-Definition und stelle sicher, dass folgende Felder korrekt definiert sind (füge sie hinzu oder passe sie an, falls nötig):
    ```javascript
    // Bestehende Felder wie id, username sollten erhalten bleiben...
    email: {
      type: DataTypes.STRING(100),
      allowNull: true, // Setze auf false, wenn E-Mail Pflicht sein soll
      unique: { // Stelle sicher, dass E-Mails eindeutig sind
        msg: 'Diese E-Mail-Adresse wird bereits verwendet.'
      },
      validate: {
        isEmail: { // Sequelize-Validierung für E-Mail-Format
          msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
        }
      }
    },
    password_hash: { // Sicherstellen, dass es existiert und nicht null sein darf
      type: DataTypes.STRING(255), // bcrypt Hashes sind typischerweise 60 Zeichen lang, aber Puffer ist gut
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'player', // Standardrolle für neue Spieler
      allowNull: false,
      validate: {
        isIn: {
          args: [['player', 'moderator', 'admin']], // Erlaubte Rollen definieren
          msg: 'Ungültige Benutzerrolle.'
        }
      }
    },
    is_active: { // Zum Deaktivieren von Accounts
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    last_login: { // Sicherstellen, dass es existiert
      type: DataTypes.DATE
    },
    // Bestehende Felder wie position_x, position_y, is_running sollten erhalten bleiben...
    ```
4.  **Hooks prüfen/implementieren:** Stelle sicher, dass die `bcrypt`-Hooks zum automatischen Hashen des Passworts vor dem Erstellen und Aktualisieren vorhanden und korrekt sind. Füge sie innerhalb des zweiten Arguments von `sequelize.define` hinzu:
    ```javascript
    // Innerhalb von sequelize.define('Player', { /* Felder */ }, { /* Optionen */ })
    hooks: {
      beforeCreate: async (player, options) => {
        if (player.password_hash) {
          player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
        }
      },
      beforeUpdate: async (player, options) => {
        // Nur hashen, wenn das Passwort explizit geändert wurde ('password_hash' ist im 'changed' Array)
        if (player.changed('password_hash') && player.password_hash) {
          // Zusätzliche Prüfung, ob der Wert bereits ein Hash ist (optional, aber sicherer)
          // bcrypt-Hashes beginnen typischerweise mit $2a$, $2b$, $2y$ gefolgt von $ und dem Cost Factor.
          if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
             player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
          } else {
             // Optional: Loggen, wenn versucht wird, einen bereits gehashten Wert zu setzen
             console.warn(`Versuch, einen bereits gehashten Wert für Player ID ${player.id} zu setzen.`);
          }
        }
      }
    }
    // Stelle sicher, dass andere Optionen wie `timestamps` erhalten bleiben, falls vorhanden
    // Beispiel: timestamps: true, underscored: true (falls Spaltennamen snake_case sind)
    ```
5.  **`checkPassword`-Methode hinzufügen:** Füge die Instanzmethode hinzu, um Passwörter vergleichen zu können. Platziere dies *nach* der `sequelize.define`-Klammer, aber *vor* `return Player;`.
    ```javascript
    // Instanzmethode zum Vergleichen des eingegebenen Passworts mit dem Hash
    Player.prototype.checkPassword = async function(password) {
      if (!password || !this.password_hash) {
         return false; // Kann nicht vergleichen, wenn eines fehlt
      }
      // bcrypt.compare behandelt das Extrahieren des Salts aus dem Hash automatisch
      return await bcrypt.compare(password, this.password_hash);
    };
    ```

**Best Practices & Überlegungen:**

*   **Validierung:** Sequelize bietet eingebaute Validatoren (`validate`). Nutze sie, um Datenkonsistenz auf Datenbankebene sicherzustellen (z.B. `isEmail`, `isIn`, `len`).
*   **Eindeutigkeit:** Verwende `unique: true` (oder `unique: { msg: '...' }` für benutzerdefinierte Fehlermeldungen) für Felder wie `username` und `email`.
*   **bcrypt Cost Factor:** `SALT_ROUNDS = 10` ist ein guter Startpunkt. Erhöhe den Wert, wenn mehr Sicherheit benötigt wird und die Performance es zulässt.
*   **Hook-Logik:** Die Prüfung im `beforeUpdate`-Hook (`player.changed('password_hash')`) ist wichtig, damit der Hash nicht bei jeder Aktualisierung des Spielers neu berechnet wird, sondern nur, wenn das Passwortfeld tatsächlich geändert wurde. Die zusätzliche Prüfung auf das Hash-Format (`!player.password_hash.match(...)`) verhindert, dass versehentlich versucht wird, einen bereits existierenden Hash erneut zu hashen.
*   **Fehlerbehandlung:** Die `checkPassword`-Methode sollte robust sein und `false` zurückgeben, wenn kein Passwort oder Hash vorhanden ist.

**Mögliche Probleme & Risiken:**

*   **Fehlendes bcrypt:** Wenn `bcrypt` nicht korrekt installiert ist, schlagen Hashing und Vergleich fehl.
*   **Falsche Hook-Implementierung:** Wenn die Hooks nicht korrekt feuern oder das Passwort nicht richtig hashen, werden Klartextpasswörter gespeichert oder der Login schlägt fehl.
*   **Datenbank-Constraints:** Wenn `unique` oder `allowNull` verletzt werden, wirft Sequelize/die Datenbank Fehler, die im Controller abgefangen werden müssen.
*   **Performance:** Ein sehr hoher `SALT_ROUNDS`-Wert kann das Hashing und damit die Registrierung/Passwortänderung verlangsamen.

**Akzeptanzkriterien:**

*   Das `Player`-Modell enthält die Felder `email`, `role` und `is_active` mit den korrekten Typen, Validierungen (`isEmail`, `isIn`) und Standardwerten. `unique: true` ist für `email` gesetzt.
*   Das Feld `password_hash` ist vorhanden und `allowNull: false`.
*   Die `bcrypt`-Hooks (`beforeCreate`, `beforeUpdate`) sind korrekt implementiert, verwenden den `SALT_ROUNDS`-Wert und hashen das Passwort nur, wenn es neu gesetzt oder geändert wird und noch nicht gehasht ist.
*   Die `checkPassword`-Instanzmethode ist vorhanden und funktioniert korrekt für den Passwortvergleich mit `bcrypt.compare`.
*   Das Modell lässt sich ohne Fehler laden und die Datenbank kann synchronisiert werden (ggf. `sync({ alter: true })` oder Migrationen verwenden, wenn Daten bereits existieren).