# Ticket 0003: Auth Controller erstellen

**Einleitung:**

Dieses Ticket implementiert das Herzstück der serverseitigen Authentifizierungslogik in Form eines "Controllers". Der Controller (`authController.js`) ist eine Sammlung von Funktionen, die spezifische Anfragen von den API-Routen (definiert in Ticket 0006) entgegennehmen und die notwendigen Schritte zur Bearbeitung dieser Anfragen koordinieren. Er interagiert mit der Datenbank (über die Modelle aus Ticket 0002), führt Logik aus (z.B. Passwortvergleich) und sendet schließlich eine Antwort an den Client zurück.

*   **Zweck der Funktionen:**
    *   **`register`:** Diese Funktion ist für die Erstellung neuer Benutzerkonten zuständig.
        *   **Ablauf:** Sie empfängt `username`, `email` (optional) und `password` vom Client. Zuerst prüft sie (optional, aber empfohlen durch Validatoren aus Ticket 0005), ob die Eingaben gültig sind. Dann schaut sie in der Datenbank nach, ob der `username` oder die `email` bereits existieren, um Duplikate zu verhindern. Wenn alles in Ordnung ist, erstellt sie einen neuen Eintrag in der `Player`-Tabelle. Das übergebene `password` wird dabei *nicht* direkt gespeichert, sondern durch den `beforeCreate`-Hook (Ticket 0002) automatisch mit `bcrypt` gehasht. Anschließend wird die Hilfsfunktion `addStarterItems` aufgerufen, um dem neuen Spieler eine Grundausstattung zu geben. Schließlich wird ein JWT (JSON Web Token) generiert, der die ID, den Benutzernamen und die Rolle des neuen Spielers enthält und mit dem geheimen Schlüssel (Ticket 0001) signiert wird. Dieses Token wird als `httpOnly` Cookie an den Client gesendet, und eine Erfolgsmeldung wird zurückgegeben.
    *   **`login`:** Diese Funktion wickelt den Anmeldevorgang ab.
        *   **Ablauf:** Sie empfängt `username` und `password`. Nach optionaler Validierung sucht sie den Benutzer anhand des `username` in der Datenbank. Sie prüft, ob der Benutzer existiert und ob sein Konto aktiv ist (`is_active`). Dann verwendet sie die `player.checkPassword()`-Methode (Ticket 0002), um das eingegebene Passwort sicher mit dem gespeicherten Hash zu vergleichen. Bei erfolgreicher Prüfung wird der `last_login`-Zeitstempel in der Datenbank aktualisiert. Ähnlich wie bei der Registrierung wird ein JWT generiert und als `httpOnly` Cookie an den Client gesendet, zusammen mit einer Erfolgsmeldung.
    *   **`logout`:** Diese Funktion meldet den Benutzer ab.
        *   **Ablauf:** Sie wird aufgerufen, nachdem die `authenticate`-Middleware (Ticket 0004) sichergestellt hat, dass ein gültiger Benutzer angemeldet ist. Die Funktion weist den Browser des Clients an, das `token`-Cookie zu löschen (`res.clearCookie`). Da das JWT die einzige Information über die Sitzung ist, ist der Benutzer damit effektiv abgemeldet.
    *   **`getCurrentUser`:** Diese Funktion liefert Informationen über den aktuell angemeldeten Benutzer.
        *   **Ablauf:** Sie wird ebenfalls nach der `authenticate`-Middleware aufgerufen. Die Middleware hat bereits den Benutzer identifiziert und dessen Daten in `req.player` gespeichert. Diese Funktion sendet einfach den Inhalt von `req.player` (ID, Username, Rolle) an den Client zurück.
    *   **`addStarterItems`:** Eine interne Hilfsfunktion, die nicht direkt über eine Route aufgerufen wird.
        *   **Ablauf:** Sie wird von `register` aufgerufen, nachdem ein neuer Spieler erstellt wurde. Sie sucht vordefinierte Starter-Items (z.B. Pokéball, Trank) anhand ihrer IDs in der `Item`-Tabelle und erstellt Einträge in der `InventoryItem`-Tabelle, um sie dem Spieler zuzuordnen. Zusätzlich wählt sie zufällig eines der Basis-Starter-Pokémon (z.B. Bisasam, Glumanda, Schiggy) aus der `PokemonBase`-Tabelle und erstellt einen Eintrag in der `PlayerPokemon`-Tabelle für den Spieler mit diesem Pokémon auf Level 5.

Diese Controller-Funktionen bilden die Logik hinter den Authentifizierungs-API-Endpunkten und interagieren mit dem Datenbankmodell und den JWT-Funktionen.

---

**Ziel:** Erstellen der Controller-Logik für Registrierung, Login, Logout und Abrufen des aktuellen Benutzers.

**Abhängigkeiten:** Ticket 0001 (Config), Ticket 0002 (Player Model)

**Aufgaben:**

1.  **Datei erstellen:** `server/controllers/authController.js`.
2.  **Imports hinzufügen:**
    ```javascript
    const jwt = require('jsonwebtoken');
    // bcrypt wird hier nicht direkt benötigt, da Hashing im Hook und Vergleich in der Instanzmethode stattfindet.
    const db = require('../models'); // Pfad ggf. anpassen
    const authConfig = require('../config/auth'); // Pfad ggf. anpassen
    const { Op } = require('sequelize'); // Operator für OR-Abfragen importieren
    // Optional: const { validationResult } = require('express-validator');
    ```
3.  **`register(req, res)` Funktion implementieren:**
    *   *(Optional)* Validierungsfehler prüfen: `const errors = validationResult(req); if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }`.
    *   `username`, `email`, `password` aus `req.body` extrahieren. **Sicherheit:** Bereinige oder validiere Eingaben sorgfältig (z.B. durch Validatoren).
    *   Prüfen auf existierenden User: `const existingPlayer = await db.Player.findOne({ where: { [Op.or]: [{ username }, { email: email || null }] } });`. Beachte, dass `email` `null` sein kann, wenn es optional ist.
    *   Wenn `existingPlayer`, Status 400 senden (`{ message: 'Benutzername oder E-Mail bereits vergeben' }`).
    *   Neuen `Player` erstellen: `const newPlayer = await db.Player.create({ username, email: email || null, password_hash: password, role: 'player', is_active: true, last_login: new Date() });`.
    *   *(Optional aber empfohlen)* `await addStarterItems(newPlayer.id);`. Fehler hier mit `try...catch` abfangen und loggen, aber die Registrierung nicht unbedingt fehlschlagen lassen.
    *   JWT Payload definieren (nur notwendige, nicht-sensible Daten): `const payload = { id: newPlayer.id, username: newPlayer.username, role: newPlayer.role };`.
    *   JWT erstellen: `const token = jwt.sign(payload, authConfig.JWT_SECRET, { expiresIn: authConfig.JWT_EXPIRES_IN });`.
    *   Cookie setzen (Sicherheitsflags beachten!): `res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: parseInt(authConfig.JWT_EXPIRES_IN) * 1000, /* z.B. 7*24*60*60*1000 */ sameSite: 'Strict' });`. `maxAge` sollte mit `expiresIn` übereinstimmen.
    *   Erfolgsantwort senden: Status 201, `{ message: 'Registrierung erfolgreich', player: { id: newPlayer.id, username: newPlayer.username, email: newPlayer.email, role: newPlayer.role } }`. (Passwort-Hash **niemals** senden!)
    *   Gesamte Funktion in `try...catch` einbetten. Bei Fehlern (z.B. DB-Fehler) Status 500 senden (`{ message: 'Serverfehler bei der Registrierung' }`) und Fehler loggen.
4.  **`login(req, res)` Funktion implementieren:**
    *   *(Optional)* Validierungsfehler prüfen.
    *   `username`, `password` aus `req.body`.
    *   Spieler suchen: `const player = await db.Player.findOne({ where: { username } });`.
    *   Prüfen, ob Spieler existiert und aktiv ist (`!player || !player.is_active`). Bei Fehler, Status 401 senden (`{ message: 'Ungültige Anmeldedaten oder Benutzer inaktiv' }`).
    *   Passwort prüfen: `const isPasswordValid = await player.checkPassword(password);`. Wenn `!isPasswordValid`, Status 401 senden (`{ message: 'Ungültige Anmeldedaten' }`).
    *   `last_login` aktualisieren: `player.last_login = new Date(); await player.save();`.
    *   JWT Payload definieren und Token erstellen (wie bei `register`).
    *   Cookie setzen (wie bei `register`).
    *   Erfolgsantwort senden: Status 200, `{ message: 'Anmeldung erfolgreich', player: { id: player.id, username: player.username, email: player.email, role: player.role } }`.
    *   Gesamte Funktion in `try...catch` einbetten. Bei Fehlern Status 500 senden (`{ message: 'Serverfehler beim Login' }`).
5.  **`logout(req, res)` Funktion implementieren:**
    *   Cookie löschen (mit den gleichen Flags wie beim Setzen, außer `maxAge`): `res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });`.
    *   Erfolgsantwort senden: Status 200, `{ message: 'Abmeldung erfolgreich' }`.
6.  **`getCurrentUser(req, res)` Funktion implementieren:**
    *   Diese Funktion wird *nach* der `authenticate`-Middleware (Ticket 0004) aufgerufen.
    *   Antworten mit den Daten aus `req.player`: `res.status(200).json({ player: req.player });`.
7.  **`addStarterItems(playerId)` Hilfsfunktion implementieren:**
    *   `async function addStarterItems(playerId) { ... }` (nicht exportieren).
    *   Definiere Starter-Items (stelle sicher, dass die `ItemId`s in der `Items`-Tabelle existieren!).
    *   Verwende `db.InventoryItem.bulkCreate(...)` für Effizienz, wenn mehrere Items hinzugefügt werden.
    *   Wähle zufällige Starter-Pokémon-ID (z.B. 1, 4, 7).
    *   Lade `PokemonBase` (`db.PokemonBase.findOne(...)`).
    *   Wenn gefunden, erstelle `PlayerPokemon` (`db.PlayerPokemon.create(...)`). Berechne HP korrekt.
    *   Umschließe die Logik mit `try...catch`. Logge Fehler, aber lasse die Registrierung nicht unbedingt fehlschlagen (ein Spieler ohne Starter-Items ist besser als keine Registrierung).

**Best Practices & Überlegungen:**

*   **Fehlerbehandlung:** Gib klare, aber nicht zu detaillierte Fehlermeldungen an den Client zurück (vermeide das Offenlegen interner Strukturen). Logge detaillierte Fehler serverseitig.
*   **Input Sanitization/Validation:** Auch wenn `express-validator` optional ist, sollten Eingaben zumindest grundlegend bereinigt werden, um z.B. XSS-Angriffe zu verhindern (obwohl dies eher clientseitig relevant ist, schadet es serverseitig nicht).
*   **JWT Payload:** Halte den Payload klein. Füge nur notwendige Informationen hinzu (ID, Username, Rolle). Vermeide sensible Daten.
*   **Cookie Security:** `httpOnly` verhindert Zugriff durch clientseitiges JavaScript (XSS-Schutz). `secure: true` stellt sicher, dass das Cookie nur über HTTPS gesendet wird (essenziell für Produktion). `sameSite: 'Strict'` bietet Schutz gegen CSRF-Angriffe.
*   **Rate Limiting:** Implementiere Rate Limiting für Login- und Registrierungs-Endpunkte, um Brute-Force-Angriffe zu erschweren (z.B. mit `express-rate-limit`).
*   **`addStarterItems` Robustheit:** Was passiert, wenn die referenzierten Items oder Pokémon nicht in der DB existieren? Die Funktion sollte damit umgehen können (z.B. Fehler loggen, Standard-Item verwenden).

**Mögliche Probleme & Risiken:**

*   **Datenbankfehler:** Fehler beim Erstellen/Suchen/Aktualisieren von Benutzern müssen abgefangen werden.
*   **JWT Signierungsfehler:** Wenn das Secret ungültig ist, schlägt `jwt.sign` fehl.
*   **Race Condition bei Registrierung:** Zwei Anfragen könnten fast gleichzeitig versuchen, denselben Benutzernamen zu registrieren. Die `unique`-Constraint der Datenbank sollte dies verhindern, aber der Code sollte den Fehler korrekt behandeln.
*   **Fehler in `addStarterItems`:** Könnte dazu führen, dass ein Benutzer ohne Items/Pokémon erstellt wird.

**Akzeptanzkriterien:**

*   Die Datei `server/controllers/authController.js` existiert.
*   Die Funktionen `register`, `login`, `logout` und `getCurrentUser` sind implementiert, exportiert und behandeln Fehler robust.
*   Die Registrierung prüft auf bestehende Benutzer, erstellt neue Benutzer, hasht Passwörter (via Hook), erstellt JWTs, setzt sichere Cookies und ruft `addStarterItems` auf. Gibt korrekte Fehler (400, 500) und Erfolgsantworten (201) zurück.
*   Der Login prüft Benutzer, Passwort und Aktivitätsstatus, aktualisiert `last_login`, erstellt JWTs und setzt sichere Cookies. Gibt korrekte Fehler (401, 500) und Erfolgsantworten (200) zurück.
*   Der Logout löscht das Token-Cookie korrekt.
*   `getCurrentUser` gibt die Daten des authentifizierten Benutzers (aus `req.player`) zurück.
*   Die `addStarterItems`-Funktion fügt Items und ein Pokémon für neue Spieler hinzu und behandelt Fehler intern.