# Ticket 0005: Auth Validatoren erstellen (Optional)

**Einleitung:**

Dieses Ticket beschreibt die optionale Implementierung von serverseitigen Validierungsregeln für die Authentifizierungs-Endpunkte mithilfe der Bibliothek `express-validator`. Validierung bedeutet, die vom Client gesendeten Daten (z.B. Benutzername, Passwort bei Login/Registrierung) zu überprüfen, *bevor* sie vom Controller (Ticket 0003) weiterverarbeitet werden. Dies ist ein wichtiger Schritt zur Sicherung der Anwendung und zur Verbesserung der Datenqualität.

*   **Zweck der Validierung:**
    *   **Datenintegrität & -konsistenz:** Stellt sicher, dass die Daten in einem erwarteten Format (z.B. gültige E-Mail) und innerhalb zulässiger Grenzen (z.B. Mindest-/Maximallänge für Benutzernamen/Passwörter) liegen. Verhindert das Speichern ungültiger Daten in der Datenbank.
    *   **Sicherheit:** Dient als erste Verteidigungslinie gegen ungültige oder potenziell schädliche Eingaben (z.B. übermäßig lange Strings, die zu Denial-of-Service führen könnten). Es ersetzt keine vollständige Sicherheitsprüfung, ist aber ein wichtiger Teil davon.
    *   **Frühes Feedback:** Ermöglicht das Senden klarer, spezifischer Fehlermeldungen an den Client zurück, *bevor* aufwändige Operationen wie Datenbankabfragen oder Passwort-Hashing durchgeführt werden. Dies spart Serverressourcen und gibt dem Benutzer schneller Rückmeldung (z.B. "Passwort muss mindestens 6 Zeichen lang sein" statt nur "Ungültige Eingabe").
    *   **Code-Sauberkeit (Separation of Concerns):** Die Validierungslogik wird aus dem Controller ausgelagert. Der Controller kann sich auf die Kernlogik konzentrieren (Benutzer suchen/erstellen, JWT generieren), während die Validatoren sich nur um die Prüfung der Eingabedaten kümmern.

*   **Logik mit `express-validator`:**
    *   Wir definieren für jeden Endpunkt (Registrierung, Login) ein Array von "Validierungsketten". Jede Kette beginnt typischerweise mit `body('feldname')`, um ein Feld aus dem Request-Body zu adressieren.
    *   An diese Kette hängen wir verschiedene Validierungs- und Bereinigungsmethoden (Sanitizer):
        *   **Validatoren:** `.notEmpty()`, `.isLength()`, `.isEmail()`, `.isAlphanumeric()`, `.matches()` (für Regex), `.custom()` (für eigene Logik, z.B. Passwortvergleich).
        *   **Sanitizer:** `.trim()` (entfernt Leerzeichen am Anfang/Ende), `.normalizeEmail()` (konvertiert E-Mail zu Kleinbuchstaben, entfernt Punkte in Gmail-Adressen etc.). Sanitizer werden *vor* den Validatoren ausgeführt.
    *   Mit `.withMessage()` definieren wir die Fehlermeldung, die zurückgegeben wird, wenn eine Regel verletzt wird.
    *   Mit `.optional()` können wir Felder als optional markieren (Validierung wird nur durchgeführt, wenn das Feld vorhanden ist).
    *   Mit `.if()` können wir bedingte Validierungen durchführen (z.B. `confirmPassword` nur prüfen, wenn `password` gesetzt ist).
    *   Diese Validator-Arrays werden dann als Express-Middleware in den entsprechenden Routen (Ticket 0006) eingebunden, *bevor* der Controller aufgerufen wird.
    *   Im Controller (Ticket 0003) rufen wir `validationResult(req)` auf. Diese Funktion sammelt alle Validierungsfehler, die von den Middleware-Ketten gefunden wurden. Wenn das Ergebnis (`errors`) nicht leer ist, senden wir die Fehler (typischerweise als Array) mit Status 400 zurück und brechen die weitere Ausführung ab.

Obwohl optional, wird die Verwendung von `express-validator` dringend empfohlen, um die API robuster, sicherer und wartbarer zu machen.

---

**Ziel:** Erstellen von Validierungsregeln für die Registrierungs- und Login-Endpunkte mithilfe von `express-validator`. Dies hilft, ungültige Daten frühzeitig abzufangen und klare Fehlermeldungen zurückzugeben.

**Abhängigkeiten:** Ticket 0001 (express-validator muss installiert sein, falls dieses Ticket umgesetzt wird)

**Aufgaben:**

1.  **Prüfen, ob `express-validator` installiert ist:** Siehe Ticket 0001. Wenn nicht, und diese Validierung gewünscht ist, installiere es (`npm install express-validator`).
2.  **Datei erstellen:** `server/validators/authValidators.js`.
3.  **Imports hinzufügen:**
    ```javascript
    const { body } = require('express-validator');
    // Optional: Importiere das Player-Modell, falls für custom validators benötigt (z.B. Eindeutigkeitsprüfung)
    // const db = require('../models');
    ```
4.  **`registerValidator` Array definieren und exportieren:**
    ```javascript
    exports.registerValidator = [
      body('username', 'Benutzername ist ungültig') // Standardfehlermeldung für die Kette
        .trim()
        .notEmpty().withMessage('Benutzername darf nicht leer sein.')
        .isLength({ min: 3, max: 50 }).withMessage('Benutzername muss zwischen 3 und 50 Zeichen lang sein.')
        .isAlphanumeric().withMessage('Benutzername darf nur Buchstaben und Zahlen enthalten.')
        // Optional: Custom validator für Eindeutigkeit (alternativ im Controller prüfen)
        // .custom(async (value) => {
        //   const existingPlayer = await db.Player.findOne({ where: { username: value } });
        //   if (existingPlayer) {
        //     return Promise.reject('Benutzername ist bereits vergeben.');
        //   }
        // }),
        ,

      body('email', 'E-Mail ist ungültig')
        .optional({ checkFalsy: true }) // Erlaubt leere Strings oder null/undefined
        .trim()
        .isEmail().withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
        .normalizeEmail()
        // Optional: Custom validator für Eindeutigkeit (alternativ im Controller prüfen)
        // .custom(async (value) => {
        //   if (!value) return; // Überspringen, wenn optional und nicht angegeben
        //   const existingPlayer = await db.Player.findOne({ where: { email: value } });
        //   if (existingPlayer) {
        //     return Promise.reject('E-Mail-Adresse ist bereits vergeben.');
        //   }
        // }),
        ,

      body('password', 'Passwort ist ungültig')
        .notEmpty().withMessage('Passwort darf nicht leer sein.')
        .isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein.')
        // Füge hier ggf. weitere Komplexitätsanforderungen hinzu:
        // .matches(/\d/).withMessage('Passwort muss mindestens eine Zahl enthalten.')
        // .matches(/[A-Z]/).withMessage('Passwort muss mindestens einen Großbuchstaben enthalten.')
        // .matches(/[a-z]/).withMessage('Passwort muss mindestens einen Kleinbuchstaben enthalten.')
        // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Passwort muss mindestens ein Sonderzeichen enthalten.')
        ,

      body('confirmPassword', 'Passwortbestätigung ist erforderlich')
        // Nur validieren, wenn 'password' vorhanden und nicht leer ist
        .if(body('password').notEmpty())
        .notEmpty().withMessage('Bitte bestätigen Sie Ihr Passwort.')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            // Wirft einen Fehler, der von express-validator abgefangen wird
            throw new Error('Die Passwörter stimmen nicht überein.');
          }
          // Wichtig: true zurückgeben, wenn die Validierung erfolgreich ist
          return true;
        })
    ];
    ```
5.  **`loginValidator` Array definieren und exportieren:**
    ```javascript
    exports.loginValidator = [
      body('username', 'Benutzername ist erforderlich')
        .trim()
        .notEmpty(),

      body('password', 'Passwort ist erforderlich')
        .notEmpty()
    ];
    ```

**Best Practices & Überlegungen:**

*   **Eindeutigkeitsprüfung:** Die Prüfung, ob `username` oder `email` bereits existieren, kann entweder hier im Validator mit `.custom()` oder im Controller (Ticket 0003) erfolgen. Im Controller ist es oft einfacher, da man dort sowieso den Benutzer sucht. Wenn es im Validator gemacht wird, muss das `db`-Modell importiert werden.
*   **Fehlermeldungen:** Formuliere klare und hilfreiche Fehlermeldungen für den Benutzer.
*   **Passwortkomplexität:** Definiere sinnvolle Komplexitätsanforderungen für Passwörter und kommuniziere diese an den Benutzer (z.B. im Registrierungsformular).
*   **Sanitization vs. Validation:** Verwende Sanitizer (`trim`, `normalizeEmail`) *vor* den Validatoren, um die Daten zu bereinigen, bevor sie geprüft werden.

**Mögliche Probleme & Risiken:**

*   **Fehlende Installation:** Wenn `express-validator` nicht installiert ist, schlägt der Serverstart fehl, sobald die Validatoren importiert werden.
*   **Falsche Regeln:** Ungenaue oder zu strenge/lockere Regeln können Benutzer frustrieren oder Sicherheitslücken lassen.
*   **Performance bei Custom Validators:** Datenbankabfragen in Custom Validators (wie bei der Eindeutigkeitsprüfung) können die Performance geringfügig beeinflussen, sind aber oft notwendig.

**Akzeptanzkriterien:**

*   Die Datei `server/validators/authValidators.js` existiert (falls das Ticket umgesetzt wird).
*   Die exportierten Arrays `registerValidator` und `loginValidator` enthalten die definierten Validierungsregeln für die entsprechenden Felder.
*   Die Validierungsregeln sind sinnvoll und entsprechen den Anforderungen (Länge, Format, erforderliche Felder, Passwortübereinstimmung).
*   Die Fehlermeldungen sind klar und verständlich.

**Hinweis:** Dieses Ticket ist optional. Wenn es umgesetzt wird, müssen die Validatoren in den Auth-Routen (Ticket 0006) verwendet und im Controller (Ticket 0003) die `validationResult`-Prüfung implementiert werden (`const errors = validationResult(req); if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }`).