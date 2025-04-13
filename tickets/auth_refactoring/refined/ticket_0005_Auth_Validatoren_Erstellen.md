Umsetzungsplan Ticket 0005 – Serverseitige Validierung mit express-validator (PokeTogetherBrowser)
In diesem Plan wird detailliert beschrieben, wie für das Projekt PokeTogetherBrowser serverseitige Validatoren für die Authentifizierungsendpunkte implementiert werden. Es werden Installation und Einrichtung von express-validator, die Implementierung eines dedizierten Validator-Moduls für Registrierung und Login, Best Practices, typische Fehlerquellen, ein kommentiertes Codebeispiel sowie Vorschläge für Tests behandelt. Das Ziel ist eine professionelle, robuste und gut verständliche Lösung, die langfristig wartbar ist und neuen Teammitgliedern den Einstieg erleichtert.
1. Installation von express-validator und Begründung der Verwendung
Installation: Die Bibliothek express-validator lässt sich einfach via npm installieren. Im Projektverzeichnis führen wir aus:
bash
Copy
npm install express-validator --save
Dadurch wird express-validator zur package.json hinzugefügt und ist bereit zur Verwendung im Node.js-Projekt​
medium.com
. Anschließend kann das Modul in unseren Servercode importiert werden, z. B. mit const { body, validationResult } = require('express-validator');. Begründung: express-validator ist eine weit verbreitete Express-Middleware zur Validierung und Sanitisierung von Request-Daten auf Server-Seite​
auth0.com
. Sie basiert auf der bewährten Bibliothek validator.js und bietet eine umfangreiche Sammlung an vorgefertigten Validatoren und Sanitizer-Funktionen, z. B. für E-Mail-Format, Mindestlängen, alphanumerische Zeichen etc.​
medium.com
. Durch diese Bibliothek vermeiden wir es, eigene Validierungslogik komplett von Grund auf neu zu schreiben, was Entwicklungszeit spart und typische Fehler reduziert. express-validator ermöglicht zudem custom Validatoren, mit denen wir projektspezifische Prüfungen (wie z. B. die Eindeutigkeit eines Benutzernamens in der Datenbank) einfach integrieren können​
express-validator.github.io
. Insgesamt erhöht der Einsatz von express-validator die Zuverlässigkeit der Eingabedaten (Schutz vor fehlerhaften oder schadhaften Eingaben)​
auth0.com
 und fördert eine saubere Trennung von Validierungslogik und Geschäftslogik im Code.
2. Implementierung des Validator-Moduls (server/validators/authValidators.js)
Für die Authentifizierungs-Endpunkte (Registrierung und Login) wird ein eigenes Validator-Modul erstellt (server/validators/authValidators.js). Dieses Modul exportiert zwei Middleware-Arrays: registerValidator für den Registrierungs-Endpoint und loginValidator für den Login-Endpoint. Beide Arrays enthalten sequenzielle Validierungs- und Sanitization-Regeln für die jeweiligen Request-Felder. Die Validatoren werden mit den express-validator-Funktionen wie body() definiert und können dann in den Routen als Middleware eingebunden werden.
Validierungsregeln für die Registrierung (registerValidator)
Die registerValidator-Middleware kümmert sich um folgende Felder (angenommen, die Registrierung erwartet username, email und password sowie passwordConfirm im Request-Body):
Benutzername (username):
Wird auf Vorhandensein und Format/Länge geprüft und auf Eindeutigkeit validiert.
Trimmen: Entfernt führende/trailing Leerzeichen mit .trim(), um Eingaben wie " user " in "user" umzuwandeln. So verhindern wir, dass nur aus Leerzeichen bestehende Eingaben als gültig zählen.
Pflichtfeld: Prüfen, dass nach dem Trimmen etwas übrig bleibt (.notEmpty()). Ist das Feld leer, wird mit withMessage() eine Fehlermeldung wie "Benutzername darf nicht leer sein." hinzugefügt.
Länge/Zeichen: Prüfung z. B. mit .isLength({ min: 3, max: 20 }) auf eine Mindest- und Höchstlänge (Beispielwerte) und ggf. erlaubte Zeichen (z. B. .isAlphanumeric() falls nur Buchstaben/Zahlen erlaubt sein sollen). Fehlermeldung z. B. "Benutzername muss 3–20 Zeichen lang sein und darf nur Buchstaben und Zahlen enthalten."
Eindeutigkeit (Custom-Validator): Mit .custom() wird eine asynchrone Datenbankprüfung eingebunden. Hierbei wird mittels Sequelize (z. B. über das User-Modell) nachgeschlagen, ob der gewünschte Benutzername bereits existiert. Die Implementierung nutzt die Sequelize-Modelle, z. B.:
js
Copy
.custom(async (username) => {
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    // Benutzername existiert bereits, Validation schlägt fehl
    throw new Error('Benutzername ist bereits vergeben.');
  }
  return true; // Benutzername ist frei, Validation erfolgreich
})
Wird ein Datensatz gefunden, wirft der Validator einen Fehler – express-validator behandelt einen geworfenen Error oder einen abgewiesenen Promise als Validierungsfehlschlag​
express-validator.github.io
​
express-validator.github.io
. Durch diese Prüfung wird sichergestellt, dass der Benutzername eindeutig ist (nicht bereits in Verwendung).
(Hinweis: Da diese Prüfung asynchron ist, muss die Validatorfunktion als async deklariert sein oder einen Promise zurückgeben. express-validator wartet automatisch auf die Auflösung​
express-validator.github.io
.)*
E-Mail (email):
Wird als optionales Feld behandelt (Benutzer kann sich evtl. auch ohne E-Mail registrieren), ansonsten aber auf Format und Eindeutigkeit geprüft.
Optionalität: Mit .optional() kann festgelegt werden, dass die folgenden Checks nur greifen, wenn eine E-Mail tatsächlich übermittelt wurde​
express-validator.github.io
. Wir setzen .optional({ checkFalsy: true }), damit sowohl undefined (Feld fehlt) als auch ein leerer String als "nicht vorhanden" gelten. So wird das Feld übersprungen, wenn der Benutzer keine E-Mail angibt oder es leer lässt.
Trimmen: Entfernt Leerzeichen auch bei E-Mail (.trim()).
Formatprüfung: .isEmail() stellt sicher, dass die Eingabe wie eine gültige E-Mail-Adresse geformt ist. Andernfalls z. B. Fehlermeldung "E-Mail-Adresse ist ungültig.".
Normalisierung: Mit .normalizeEmail() wird die E-Mail in ein Standardformat gebracht (z. B. Kleinschreibung, Entfernen irrelevanter Punkte bei Gmail-Adressen etc.). Dies hilft, Konsistenz bei Vergleichen (z. B. für die Eindeutigkeit) zu gewährleisten. Die Normalisierung beeinflusst den Wert in req.body entsprechend.
Eindeutigkeit (Custom-Validator): Ähnlich wie beim Benutzernamen wird per .custom() geprüft, ob die angegebene E-Mail (falls angegeben) bereits im System existiert:
js
Copy
.custom(async (email) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('E-Mail-Adresse wird bereits verwendet.');
  }
  return true;
})
Auch hier wird bei Doppelung ein Fehler geworfen (bzw. Promise abgelehnt), was vom Validator als Fehlerzustand erkannt wird. Dadurch erzwingen wir eindeutige E-Mail-Adressen im System.
Passwort (password):
Das Passwortfeld unterliegt mehreren Validierungen, um Sicherheit und Korrektheit sicherzustellen:
Mindestlänge: z. B. .isLength({ min: 8 }) für mindestens 8 Zeichen Länge. Fehlermeldung etwa "Passwort muss mindestens 8 Zeichen lang sein."
Komplexität: Einsatz mehrerer .matches() oder dedizierter Validatoren, um gewisse Zeichenklassen zu erzwingen – z. B.
.matches(/\d/).withMessage('Passwort muss mindestens eine Zahl enthalten.') (mindestens eine Ziffer)​
medium.com
,
.matches(/[A-Z]/).withMessage('Mindestens ein Großbuchstabe erforderlich.'),
.matches(/[a-z]/).withMessage('Mindestens ein Kleinbuchstabe erforderlich.'),
.matches(/\W/).withMessage('Mindestens ein Sonderzeichen erforderlich.').
Solche Regeln stellen sicher, dass das Passwort nicht zu trivial ist und grundlegende Komplexitätsanforderungen erfüllt (Buchstaben, Zahlen, Symbole)​
medium.com
. Die Fehlermeldungen sind jeweils spezifisch gehalten, um dem Benutzer mitzuteilen, welche Anforderung nicht erfüllt ist.
Weitere Checks: Gegebenenfalls kann .not().isIn(['password','123456',...]) genutzt werden, um verbotene, unsichere Passwörter abzulehnen (mit entsprechender Fehlermeldung).
Passwort-Bestätigung (passwordConfirm):
Falls im Registrierungsformular eine Passwort-Wiederholung erfasst wird, muss diese mit dem Passwort übereinstimmen:
Pflichtfeld: .notEmpty().withMessage('Passwortbestätigung darf nicht leer sein.') stellt sicher, dass das Feld ausgefüllt wurde.
Übereinstimmung mit Passwort: Ein Custom-Validator .custom((value, { req }) => { ... }) vergleicht value (Passwortbestätigung) mit req.body.password. Wenn beide nicht übereinstimmen, wird ein Fehler geworfen​
express-validator.github.io
:
js
Copy
.custom((confirmPassword, { req }) => {
  if (confirmPassword !== req.body.password) {
    throw new Error('Passwörter stimmen nicht überein.');
  }
  return true;
})
Dadurch wird sichergestellt, dass der Benutzer sich nicht vertippt hat – beide Passworteingaben müssen identisch sein, sonst Validierungsfehler.
All diese Validierungsregeln werden in einem Array gesammelt, das als Middleware eingesetzt werden kann. Jede Regel fügt bei Fehlschlag eine klar verständliche Fehlermeldung hinzu (mittels withMessage() oder durch Werfen eines Errors mit passendem Text), sodass der Client im Fehlerfall genaue Hinweise erhält, welches Feld warum nicht valide war. express-validator ermöglicht es, mehrere Validatoren pro Feld zu definieren und aneinander zu ketten; wir haben die wichtigsten für Registrierung abgedeckt (Benutzername eindeutig, E-Mail-Format und eindeutig, Passwort sicher und bestätigt)​
medium.com
.
Validierungsregeln für den Login (loginValidator)
Der loginValidator kümmert sich um die Prüfung der Anmeldedaten. In der Regel sind das Benutzername/Email und Passwort:
Benutzername/E-Mail: Je nach Login-Implementierung muss der Nutzer entweder seinen Benutzernamen oder seine E-Mail zur Authentifizierung angeben. Hier nehmen wir an, das Feld heißt z. B. identifier oder username und kann sowohl Benutzernamen als auch E-Mail aufnehmen. Minimale Validierung:
Pflichtfeld: .trim().notEmpty().withMessage('Benutzername oder E-Mail wird benötigt.') – entfernt zunächst Leerzeichen und prüft dann, dass das Feld nicht leer ist. Ist das Feld leer (nach Trimmen), wird eine Fehlermeldung zurückgegeben, dass der Benutzer etwas eingeben muss.
Format: Optional könnte man prüfen, ob der Eingabewert wie eine E-Mail aussieht oder nicht, um dem Benutzer ggf. unterschiedliche Meldungen zu geben. Allerdings ist dies für die Anmeldung nicht zwingend – Hauptsache, es ist nicht leer. In der Login-Logik selbst (Geschäftslogik) wird dann der Wert entweder als Benutzername oder E-Mail in der DB gesucht. (Man könnte z. B. einen Custom-Validator schreiben, der erkennt, ob es zur Eingabe überhaupt einen Account gibt, aber dies wird meist im Login-Controller gehandhabt, nicht im generischen Validator.)
(Hinweis: Wenn die Projektanforderung explizit vorsieht, dass sowohl Benutzername als auch E-Mail als getrennte Felder übergeben werden können, müsste man zwei Felder validieren. Hier nehmen wir vereinfachend einen Identifier an.)
Passwort:
Pflichtfeld: .notEmpty().withMessage('Passwort wird benötigt.'). (Auch hier vorher .trim() anwenden, falls Leerzeichen relevant sein könnten, wobei Passwörter normalerweise nicht mit führenden Leerzeichen kommen.)
Auf weitere inhaltliche Validierung (Länge, etc.) kann beim Login verzichtet werden, da wir beim Login nur prüfen, ob die Kombination stimmt. Die Komplexität wurde bereits bei der Registrierung sichergestellt. Wichtig ist, dass das Feld überhaupt gesendet wurde.
Beide Regeln (Identifier und Passwort) kommen ins loginValidator-Array. Damit stellen wir sicher, dass bei einem Login-Request keine leeren Felder verarbeitet werden. Anders als bei der Registrierung prüfen wir hier nicht die Existenz des Benutzers per DB im Validator – das erfolgt typischerweise in der Login-Geschäftslogik (z. B. Vergleich des Passwort-Hashes), weil wir im Fehlerfall meist eine generische Meldung zurückgeben (um nicht durch Validierung zu verraten, ob ein Benutzer existiert). Der Fokus der express-validator Middleware beim Login liegt auf Vollständigkeit der Eingabe (keine leeren Felder).
Strukturierte Fehlermeldungen
Die oben genannten Validatoren nutzen konsistent withMessage() oder Fehlermeldungen in Error-Throws, um aussagekräftige Messages zu definieren. express-validator sammelt alle Fehler in einem Ergebnis. In der Request-Route kann man mit validationResult(req) diese Fehler abfragen und z. B. als JSON zurückgeben. Ein gängiges Format ist eine Liste von Fehlerobjekten pro Feld. Zum Beispiel könnten wir die Fehler so formatieren:
js
Copy
const errors = validationResult(req);
if (!errors.isEmpty()) {
  // Fehlerliste aufbereiten
  const errorArray = errors.array().map(err => ({ field: err.param, message: err.msg }));
  return res.status(400).json({ errors: errorArray });
}
Dies würde dem Client ein JSON liefern, das etwa so aussieht:
json
Copy
{
  "errors": [
    { "field": "username", "message": "Benutzername ist bereits vergeben." },
    { "field": "password", "message": "Passwort muss mindestens 8 Zeichen lang sein." }
  ]
}
Dadurch sind die Fehlermeldungen klar strukturiert: für jedes fehlerhafte Feld gibt es einen Eintrag mit Feldname und Meldung. Dieses Format lässt sich auf Client-Seite leicht verarbeiten. (Hinweis: express-validator liefert von sich aus mit errors.array() eine Liste von Objekten mit u.a. param und msg​
stackoverflow.com
. Man kann diese direkt zurückgeben oder – wie oben gezeigt – noch in ein eigenes Schema überführen, z. B. um die Feldnamen als Schlüssel zu verwenden​
dev.to
​
dev.to
.) Zusammenfassend definiert das Modul authValidators.js alle erforderlichen Prüfungen für Registrierung und Login an zentraler Stelle. Im nächsten Abschnitt werden bewährte Vorgehensweisen erläutert, die bei der Implementierung zu beachten sind.
3. Best Practices bei Validierungslogik
Für eine saubere und effiziente Umsetzung der Validatoren sollten die folgenden Best Practices berücksichtigt werden:
Trennung von Validierung und Geschäftslogik: Halten Sie die Validierungsregeln getrennt von der eigentlichen Geschäftsfunktion (z. B. Benutzer erstellen oder Login durchführen). Die Validatoren werden als Middleware vor dem Controller ausgeführt. So gelangt eine Anfrage mit ungültigen Daten gar nicht erst in die eigentliche Verarbeitung​
stackoverflow.com
. Dies erhöht die Sicherheit und Wartbarkeit – die Controller-Logik bleibt schlank und fokussiert sich nur auf korrekte Daten.
Wiederverwendbarkeit und Modulorganisation: Platzieren Sie Validierungsregeln in einem eigenen Modul (wie authValidators.js), anstatt sie direkt in der Routenfunktion zu definieren. Das macht den Code übersichtlicher und erleichtert Wartung und Tests​
dev.to
. Ggf. kann man auch pro Endpunkt (Register, Login, etc.) separate Rule-Sets definieren und diese aus dem Modul exportieren.
Einsatz von Sanitizer-Funktionen: Nutzen Sie Funktionen wie .trim() und .normalizeEmail() vor den eigentlichen Validierungen, um Eingaben zu bereinigen. So vermeiden Sie z. B., dass " " (nur Leerzeichen) als gültiger nicht-leerer Wert durchgeht oder dass E-Mails aufgrund Groß-/Kleinschreibung falsch bewertet werden. Reihenfolge ist wichtig: immer erst reinigen, dann prüfen. Beispiel: .trim().notEmpty() stellt sicher, dass ein Feld nicht nur aus Leerzeichen besteht – würde man .trim() erst nach .notEmpty() anwenden, würde .notEmpty() auf ungetrimte Daten prüfen und " " fälschlicherweise als nicht leer ansehen.
Klare Fehlermeldungen mit withMessage(): Jeder Validierungsschritt sollte eine verständliche Fehlermeldung setzen, entweder direkt per withMessage()​
medium.com
 oder indirekt durch einen Error im Custom-Validator. Vermeiden Sie generische oder mehrdeutige Meldungen. Im Falle mehrerer möglicher Fehler pro Feld (z. B. Passwort zu kurz und kein Sonderzeichen) sollten die Meldungen spezifisch bleiben – idealerweise aber durch Bailing (siehe nächster Punkt) pro Durchlauf nur ein Fehler pro Feld zurückgegeben werden, um den Nutzer nicht zu überfordern.
bail() verwenden, um Folgeverarbeitungen zu stoppen: express-validator bietet die Methode .bail(), die dafür sorgt, dass bei einem Fehler im aktuellen Validierungs-Chain keine weiteren Validierungen für dieses Feld ausgeführt werden​
express-validator.github.io
. Dies ist sinnvoll, um unnötige Prüfungen (und z. B. DB-Abfragen) zu vermeiden, wenn ein Feld schon einen Fehler hat. Beispiel: body('email').isEmail().withMessage('Ungültige Email').bail().custom(checkEmailUniqueness). So wird die teure Datenbankprüfung checkEmailUniqueness nur ausgeführt, wenn das Format valide ist. Dies verbessert die Performance und vermeidet doppelte Fehlermeldungen.
Performance der Custom-Validatoren: Da Custom-Validatoren (wie die Datenbankabfragen) asynchron sind, sollte auf effiziente Implementierung geachtet werden. Für die Eindeutigkeit von Benutzername/E-Mail setzen wir je eine gezielte findOne-Abfrage mit einem passenden Index (z. B. eindeutiger Index in der DB auf Benutzername/E-Mail). Diese Abfragen sind in der Regel sehr schnell. Dennoch gilt: Führen Sie keine unnötigen Abfragen durch. Durch .bail() (siehe oben) stellen wir sicher, dass wir die DB nur befragen, wenn notwendige Grundvoraussetzungen erfüllt sind (z. B. korrektes Format). Falls in einem Request mehrere Custom-Validatoren parallel DB-Zugriffe ausführen (z. B. Username und E-Mail bei Registrierung), werden diese von express-validator im Normalfall parallel ausgeführt, was die Gesamtwartezeit reduziert. Das ist in Ordnung, solange die DB Last verkraftet – bei Performanceproblemen könnte man in Betracht ziehen, z. B. eine kombinierte Abfrage zu nutzen, aber im Allgemeinen sind separate Abfragen für zwei Felder akzeptabel.
Keine Logik-Doppelung in Validatoren: Vermeiden Sie, dass die Validatoren Geschäftslogik vorwegnehmen. Beispiel: Die Prüfung "Benutzer existiert und Passwort stimmt" gehört in den Login-Controller, nicht als Validator, da man aus Sicherheitsgründen meistens nicht präzise an den Client melden will, welcher Teil falsch war. Validieren Sie also nur Eingabeformat, Vorhandensein und grundsätzliche Korrektheit, aber führen Sie keine Authentifizierung im Validator aus.
Konsistenz zwischen Frontend und Backend-Validierung: Falls es clientseitige Validierungen gibt (z. B. in einem Formular), sollten diese mit den serverseitigen übereinstimmen (z. B. gleiche Passwortregeln). Dennoch niemals nur auf Frontend verlassen, immer serverseitig prüfen (der Server muss unsichere Clients abfangen). Konsistente Regeln sorgen für einheitliche Fehlermeldungen und verhindern Verwirrung.
Dokumentation und Kommentare: Da die Validierungsregeln komplex sein können (gerade Passwortregeln, Custom-Validatoren), empfiehlt es sich, im Code Kommentare anzubringen (siehe Beispiel weiter unten). So verstehen auch neue Entwickler schnell, was geprüft wird. Außerdem erleichtert dies die Wartung – etwa wenn sich die Anforderungen ändern (z. B. Passwortlänge erhöhen).
Durch Einhaltung dieser Best Practices erreichen wir eine robuste Validierungsschicht, die sauber in die Express-Anwendung integriert ist, wartbar bleibt und für Entwickler sowie Nutzer klare Ergebnisse liefert.
4. Typische Fehlerquellen und wie man sie vermeidet
Bei der Implementierung von Validatoren mit express-validator können einige Stolperfallen auftreten. Hier sind typische Fehlerquellen und Tipps zu deren Vermeidung:
Validierung vs. Sanitization in falscher Reihenfolge: Wie erwähnt, kann die Reihenfolge der Methoden in der Validierungskette zu unerwarteten Ergebnissen führen, wenn man sie vertauscht. Ein häufiges Beispiel: .notEmpty().trim() in dieser Reihenfolge würde bei Eingabe " " kein Fehler liefern, da .notEmpty() vor dem Trimmen greift und Leerzeichen als nicht-leer ansieht. Lösung: Sanitizer wie .trim() immer vor Prüfungen wie .notEmpty() platzieren. In der Praxis: .trim().notEmpty().
Async Custom-Validator nicht korrekt implementiert: Wenn man asynchrone Validatoren verwendet (z. B. DB-Abfragen), muss man sicherstellen, dass die Funktion entweder einen Promise zurückgibt oder mit async/await definiert ist​
express-validator.github.io
. Ein häufiger Fehler ist, einen Callback zu verwenden oder async zu vergessen – dann läuft die Überprüfung ins Leere und express-validator geht evtl. davon aus, die Validierung sei direkt erfolgreich. Lösung: Immer async vor die Funktion schreiben (oder return des Promise). Beispiel: body('username').custom(async value => { ... }). Intern wartet der Validator auf await innerhalb der Funktion bzw. auf den zurückgegebenen Promise​
express-validator.github.io
. Ebenso wichtig: Bei Fehlerfällen muss ein Fehler geworfen oder ein Promise Reject erfolgen. Wenn man stattdessen einfach false zurückgibt, ohne withMessage(), würde express-validator einen generischen Fehlertext wie "Invalid value" erzeugen. Daher besser throw new Error('...') mit aussagekräftiger Meldung, oder .custom(val => { if(!val) return Promise.reject('Msg') }) nutzen.
Vergessen, express-validator im Code zu verwenden/ergebnisse auszulesen: Man installiert die Bibliothek, definiert Validatoren, aber vergisst in der Route app.use() oder router.post(..., validator, handler) zu nutzen. Oder man führt die Middleware zwar aus, wertet aber die Resultate nicht aus. Dies führt dazu, dass Validierungsfehler ignoriert werden. Lösung: Immer die Validator-Middleware im Routen-Handler einbinden und im Handler mit validationResult(req) prüfen​
stackoverflow.com
. Vergisst man letzteres, bekommen die Nutzer nie eine Fehlermeldung und die Anfrage würde trotz Validation-Fehler weiterverarbeitet.
Nicht installierte oder falsch importierte Abhängigkeiten: Ein simpler, aber häufiger Stolperstein ist, express-validator nicht in der package.json zu haben oder es falsch zu importieren. In neueren Versionen genügt require('express-validator'), während ältere Dokus noch require('express-validator/check') erwähnen​
auth0.com
. Lösung: Sicherstellen, dass npm install express-validator ausgeführt wurde und im Code die korrekte Importsyntax verwendet wird (für Version 6+ z. B. { body, validationResult } = require('express-validator')). Ähnliches gilt für Sequelize/Modelle – User-Modell muss verfügbar sein (korrekte Pfade beim Import).
optional() falsch verwendet: Wenn optionale Felder validiert werden, muss man genau verstehen, wann die Validierung übersprungen wird. Standardmäßig betrachtet .optional() ein Feld als vorhanden, sobald es im Request-Body vorhanden ist, auch wenn es leer ist​
express-validator.github.io
. D.h. ein leeres String-Feld würde ohne Zusatz immer noch validiert werden (und dann z. B. .isEmail() failen). Lösung: optional({ checkFalsy: true }) nutzen, um auch leere Strings/0/false als abwesend zu behandeln, sofern das gewünscht ist. Alternativ im Frontend leere Felder gar nicht senden. Missverständnisse hier können dazu führen, dass man dachte ein Feld sei optional, aber Nutzer trotzdem Fehlermeldungen bekommen.
Fehlerhafte Express-Route Integration: Achten Sie darauf, dass die Validatoren vor dem eigentlichen Handler registriert sind. Beispiel richtig: router.post('/register', registerValidator, registerController). Wenn man versehentlich registerController vor registerValidator angibt, wird die Validierung nie ausgeführt. Ebenso sollte man, wenn man eigene Middleware zur Fehlerbehandlung schreibt, diese korrekt platzieren (z. B. wie im StackOverflow-Beispiel direkt nach den Checks eine anonyme Middleware, die validationResult prüft​
stackoverflow.com
).
Probleme bei mehreren Fehlern pro Feld: Wenn man ohne bail() viele Regeln aneinander reiht, kann es sein, dass express-validator mehrere Fehler für dasselbe Feld ausgibt (z. B. "Passwort zu kurz" und "Passwort braucht Zahl"). Das ist nicht direkt ein Fehler, aber kann unschön sein. Tipp: Ggf. bail() einstreuen, um nach dem ersten Fehler pro Feld abzubrechen, und dem Nutzer pro Feld immer nur eine Meldung zu zeigen. Die Reihenfolge der Validatoren bestimmt dann, was priorisiert gemeldet wird.
Fehlende DB-Indizes für Unique-Checks: Dies ist mehr eine Architektursache – stellt sicher, dass in der Datenbank selbst Unique-Constraints oder Indizes auf Benutzername/E-Mail bestehen. Unsere Validatoren sollten theoretisch immer fangen, wenn ein Duplikat angelegt würde. Falls aber z. B. zwei Requests gleichzeitig dieselben Daten prüfen (Race Condition), kann es ohne DB-Constraint zu doppelten Einträgen kommen. Best Practice: Neben den Validatoren einen eindeutigen Constraint in der Datenbank definieren. Tritt doch mal ein Verstoß auf, fängt Sequelize den DB-Fehler ab. Dieser Aspekt geht über express-validator hinaus, ist aber wichtig für Datenkonsistenz.
Indem man auf diese Punkte achtet, lassen sich viele gängige Fehler vermeiden. Insbesondere das korrekte Einbinden/Verketten der Middleware und die sorgfältige Implementierung asynchroner Validatoren sind entscheidend dafür, dass unsere Validierung zuverlässig funktioniert.
5. Kommentiertes Beispiel: Struktur des Validator-Moduls und Integration
Im Folgenden ein Beispiel-Code für server/validators/authValidators.js, der die Struktur der Validatoren für Registrierung und Login zeigt. Die wichtigsten Abschnitte sind kommentiert, um zu erläutern, welche Funktionalität jeweils umgesetzt wird. Anschließend wird skizziert, wie diese Validatoren in die Express-Routen integriert werden.
js
Copy
// server/validators/authValidators.js

const { body } = require('express-validator');
const { User } = require('../models');  // Sequelize User-Modell, für DB-Abfragen

// Validierungsregeln für die Registrierung
const registerValidator = [
  // 1. Benutzername: trimmen, Pflicht, Länge 3-20, nur Alphanumerisch, und Einzigartigkeit prüfen
  body('username')
    .trim()  // entfernt überflüssige Leerzeichen
    .notEmpty().withMessage('Benutzername darf nicht leer sein.')
    .isLength({ min: 3, max: 20 }).withMessage('Benutzername muss 3-20 Zeichen lang sein.')
    .isAlphanumeric().withMessage('Benutzername darf nur Buchstaben und Zahlen enthalten.')
    .custom(async (value) => {               // Asynchroner Custom-Validator für Einzigartigkeit
      const user = await User.findOne({ where: { username: value } });
      if (user) {
        // Benutzername bereits vergeben -> Fehler werfen
        throw new Error('Benutzername ist bereits vergeben.');
      }
      return true;                           // alles ok -> Validation erfolgreich
    }),

  // 2. E-Mail: optional, wenn angegeben Format prüfen und Einzigartigkeit sicherstellen
  body('email')
    .optional({ checkFalsy: true })          // wenn Feld fehlt oder leer ist, überspringen
    .trim()
    .isEmail().withMessage('E-Mail-Adresse ist ungültig.')
    .normalizeEmail()                        // normalisiert z.B. Groß-/Kleinschreibung
    .custom(async (value) => {               // Custom-Validator für einzigartige E-Mail
      const user = await User.findOne({ where: { email: value } });
      if (user) {
        throw new Error('E-Mail-Adresse wird bereits verwendet.');
      }
      return true;
    }),

  // 3. Passwort: Mindestlänge und Komplexitätsregeln (Zahl, Groß-, Kleinbuchstabe, Sonderzeichen)
  body('password')
    .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein.')
    .matches(/\d/).withMessage('Passwort muss mindestens eine Zahl enthalten.')
    .matches(/[A-Z]/).withMessage('Passwort muss mindestens einen Großbuchstaben enthalten.')
    .matches(/[a-z]/).withMessage('Passwort muss mindestens einen Kleinbuchstaben enthalten.')
    .matches(/\W/).withMessage('Passwort muss mindestens ein Sonderzeichen enthalten.'),

  // 4. Passwortbestätigung: muss ausgefüllt sein und mit Passwort übereinstimmen
  body('passwordConfirm')
    .trim()
    .notEmpty().withMessage('Passwortbestätigung darf nicht leer sein.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        // stimmt nicht mit Passwort überein
        throw new Error('Passwörter stimmen nicht überein.');
      }
      return true;
    })
];

// Validierungsregeln für den Login
const loginValidator = [
  // 1. Benutzername oder E-Mail (Identifier): Pflicht
  body('username')  // hier angenommen, dass Nutzer entweder Benutzername oder E-Mail in 'username' schickt
    .trim()
    .notEmpty().withMessage('Benutzername oder E-Mail ist erforderlich.'),

  // 2. Passwort: Pflicht
  body('password')
    .notEmpty().withMessage('Passwort ist erforderlich.')
];

module.exports = { registerValidator, loginValidator };
Erläuterungen zum Code: In registerValidator sehen wir vier Segmente:
Benutzername – Es werden mehrere Validatoren aneinandergereiht: zuerst trim, dann notEmpty mit Fehlermeldung, dann Längen- und Inhaltsprüfung und schließlich ein custom-Validator für die Datenbankprüfung. Jeder Schritt verwendet withMessage() bzw. beim Custom-Validator wird im Fehlerfall ein Error mit einer Nachricht geworfen. So entstehen verständliche Fehlermeldungen, falls eine Bedingung nicht erfüllt ist.
E-Mail – Das Feld ist optional. Falls ausgefüllt, wird es getrimmt, auf E-Mail-Format geprüft und normalisiert. Anschließend prüft ein Custom-Validator die Einzigartigkeit. Ist keine E-Mail angegeben, überspringt .optional alle folgenden Checks für dieses Feld (somit gibt es auch keinen Fehler, wenn der Nutzer keine E-Mail angibt).
Passwort – Hier werden mehrere Anforderungen definiert (Länge und Muster). Falls eine davon fehlschlägt, erhält der Benutzer eine entsprechende Meldung. Zum Beispiel würde ein Passwort "abc" Fehler für Länge, Zahl, Großbuchstabe, Sonderzeichen auslösen. (Mit .bail() könnte man hier nach dem Längen-Fehler abbrechen, um nicht vier Meldungen zu einem Feld zu erzeugen.)
Passwortbestätigung – Die Wiederholung wird verglichen. Dafür nutzt der Custom-Validator den req-Parameter von express-validator, um auf das ursprüngliche Passwort zuzugreifen (req.body.password). Stimmen sie nicht überein, wird ein Fehler geworfen. Ansonsten true zurückgegeben.
Im loginValidator sind die Regeln simpler: beide Felder sind nur auf Nicht-Leer geprüft. (Man könnte hier auch .trim() und z. B. .isEmail().optional() hinzufügen, falls man E-Mail-Logins speziell behandeln möchte – je nach genauer Anforderung.) Integration in Routes: Das Validator-Modul wird in den Routen eingebunden. Angenommen, wir haben eine Express-Router-Datei routes/auth.js für Authentifizierung:
js
Copy
// routes/auth.js (Ausschnitt)
const express = require('express');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const { validationResult } = require('express-validator');
const authController = require('../controllers/authController');  // imaginärer Controller

const router = express.Router();

router.post('/register', registerValidator, (req, res) => {
  // Validierungsergebnis prüfen
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Bei Fehlern: 400 Response mit den Fehlerdetails
    return res.status(400).json({ errors: errors.array() });
  }
  // Wenn keine Validierungsfehler:
  authController.register(req, res);
  // (Der Controller kümmert sich z.B. ums Hashen des Passworts und Speichern des neuen Nutzers)
});

router.post('/login', loginValidator, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Fehler (z.B. leere Felder) -> 400 Response
    return res.status(400).json({ errors: errors.array() });
  }
  authController.login(req, res);
  // (Im Controller wird geprüft, ob der Benutzer existiert und Passwort korrekt ist)
});

module.exports = router;
Wichtig ist hier zu sehen, dass registerValidator und loginValidator als Middleware-Array vor der eigentlichen Handler-Funktion eingesetzt werden. Express führt zuerst alle Middleware-Funktionen der Reihe nach aus – in diesem Fall also die Validierungsregeln. Diese Middleware manipuliert die Request-Daten (z. B. trimmed Felder) und fügt bei Fehlern entsprechende Informationen hinzu, bricht aber den Request nicht selbstständig ab. Daher wird direkt im Anschluss innerhalb der Route mittels validationResult(req) geprüft, ob Fehler vorliegen. Falls ja, senden wir eine Antwort mit Status 400 und den Fehlermeldungen und rufen den Controller nicht auf. Durch das return stellen wir sicher, dass der Request-Zyklus hier endet. Sind keine Fehler vorhanden, wird der jeweilige Controller (authController.register bzw. .login) ausgeführt, der dann die Geschäftslogik übernimmt. Dieses Muster trennt Validation und Business Logic sauber: Die Controller können davon ausgehen, valide Daten zu erhalten. Die Verwendung von validationResult und Zurücksenden der Fehler entspricht dem Standardmuster von express-validator​
stackoverflow.com
. Alternativ könnte man auch eine generische Fehlerbehandlungs-Middleware einsetzen (z. B. wie in einigen Tutorials gezeigt wird, um nicht in jeder Route den selben Fehlercheck zu schreiben), doch aus Gründen der Einfachheit und Nachvollziehbarkeit ist es hier explizit in der Route dargestellt.
6. Testvorschläge für die Validatoren
Um die Qualität und Korrektheit der implementierten Validatoren sicherzustellen, sollten entsprechende Tests geschrieben werden. Hier einige Empfehlungen, welche Testszenarien abzudecken sind, Beispiele für Testdaten und geeignete Test-Tools:
Unit- und Integrationstests für Validierungsregeln
Einzelfeld-Validierungen (Unit-Tests): Testen Sie jede Validierungsregel isoliert mit unterschiedlichen Eingaben. Beispiele:
Benutzername zu kurz ("ab") -> Erwartung: Fehler wegen Mindestlänge.
Benutzername mit unerlaubten Zeichen ("user!") -> Fehler wegen Alphanumeric-Regel.
Benutzername schon vergeben (setzen Sie voraus, dass z. B. "existingUser" bereits in DB ist) -> Fehler durch Custom-Validator "bereits vergeben".
E-Mail nicht angegeben (Feld fehlt) -> Erwartung: keine Fehler bezüglich E-Mail (da optional und skip).
E-Mail leerer String (email: "") -> Erwartung: ebenfalls kein Fehler (durch checkFalsy sollte es skippen).
E-Mail Format invalide ("not-an-email") -> Fehler "ungültig".
E-Mail valide aber schon registriert -> Fehler "wird bereits verwendet".
Passwort zu kurz ("Aa1!" nur 4 Zeichen) -> Fehler Mindestlänge.
Passwort ohne Zahl ("Password!") -> Fehler "eine Zahl enthalten".
Passwort ohne Großbuchstabe ("password1!") -> Fehler "ein Großbuchstaben enthalten".
Passwort ohne Sonderzeichen ("Password1") -> Fehler "ein Sonderzeichen enthalten".
Passwort und Bestätigung unterschiedlich (password = "Abcdef1!", passwordConfirm = "Abcdef1?") -> Fehler "stimmen nicht überein".
Alle Felder gültig (z. B. username: "NewUser", email: "test@example.com", password: "Abcdef1!", passwordConfirm: "Abcdef1!" wobei weder "NewUser" noch "test@example.com" in DB existieren) -> Erwartung: keine Fehler, Validation passes.
Login: username Feld leer -> Fehler.
Login: password Feld leer -> Fehler.
Login: beide Felder ausgefüllt -> keine Validierungsfehler (unabhängig davon, ob die Kombi gültig ist, das prüft dann der Login selbst).
Diese Unit-Tests können die Validator-Funktionen direkt aufrufen. Da express-validator als Middleware konzipiert ist, ist ein direkter Aufruf etwas tricky – man kann aber express-validator’s check() oder body() außerhalb eines echten Requests nutzen, oder besser: Integrationstests mit einer laufenden Express-App durchführen (siehe unten). Alternativ lässt sich validationResult() in Tests manuell anwenden, nachdem man die Middleware durchlaufen ließ. Ein Ansatz für Unit-Tests ist die Verwendung von supertest in Kombination mit einem Test-Express-App, um die Middleware-Kette zu triggern.
Integrationstests der Routen: Starten Sie die Express-App (oder isoliert den Router) mit den Validator-Middleware und entsprechenden Dummy-Controllern, und verwenden Sie Supertest (ein populäres Testmodul für HTTP-Tests in Node) um Requests gegen die Endpunkte zu simulieren. Beispiel:
POST /register mit Body {"username": "", "email": "invalid", "password": "abc", "passwordConfirm": "def"} senden. Erwartung: Response 400 mit mehreren Fehlermeldungen (username leer, email ungültig, password zu kurz, passwordConfirm stimmt nicht).
POST /register mit einem bereits existierenden Usernamen oder E-Mail im Body. Erwartung: Response 400 mit entsprechender Meldung.
POST /register mit gültigen Daten. Erwartung: Response nicht 400 (entweder 200 OK oder was der Controller definiert), und ggf. prüfen, ob Controller aufgerufen wurde (z. B. via einen Dummy der einen Flag setzt).
POST /login mit fehlendem Passwort. Erwartung: 400 mit Fehler für Passwort.
POST /login mit fehlendem Username. Erwartung: 400 mit Fehler für Username.
POST /login mit beiden Feldern. Erwartung: 200 (wenn z. B. Controller bei Test einfach einen 200 sendet), da Validatoren durchgehen.
Diese Integrationstests stellen sicher, dass die Middleware in der Express-Route tatsächlich wie erwartet funktioniert und die Fehler im Response auftauchen.
Testdaten und erwartete Fehler
Bereiten Sie für die Tests eine Matrix von Eingabewerten und erwarteten Fehlermeldungen vor. Einige konkrete Testfälle mit Beschreibung:
TC1: Benutzername leer – Eingabe: { username: " ", email: "test@example.com", password: "Abcdef1!", passwordConfirm: "Abcdef1!" }. Erwartung: Fehler bei username = "Benutzername darf nicht leer sein." (Leerzeichen werden getrimmt und dann erkannt als leer).
TC2: Benutzername bereits vergeben – Eingabe: { username: "ExistingUser", email: "new@example.com", ... } wobei "ExistingUser" schon in DB existiert. Erwartung: Fehler username = "Benutzername ist bereits vergeben.".
TC3: E-Mail optional nicht angegeben – Eingabe: { username: "NewUser", /* email fehlt */, password: "Abcdef1!", passwordConfirm: "Abcdef1!" }. Erwartung: keine Fehlermeldung zu E-Mail (email wird übersprungen).
TC4: E-Mail Format falsch – Eingabe: { username: "NewUser", email: "notanemail", password: "...", passwordConfirm: "..."}. Erwartung: Fehler email = "E-Mail-Adresse ist ungültig.".
TC5: E-Mail schon verwendet – Eingabe: { username: "NewUser", email: "existing@example.com", ... } wobei diese E-Mail bereits in DB. Erwartung: Fehler email = "E-Mail-Adresse wird bereits verwendet.".
TC6: Passwort zu schwach – z. B. { username: "NewUser", email: "new@example.com", password: "abcdefg1", passwordConfirm: "abcdefg1"} (kein Großbuchstabe, kein Sonderzeichen). Erwartung: Fehler password enthält Meldungen zu Großbuchstabe und Sonderzeichen. (Je nach Implementierung vielleicht zwei separate Fehlermeldungen, was okay ist, oder man hat bail so gesetzt, dass nach erstem Fehler abgebrochen wird. In dem Fall müsste man zwei Tests machen – einen wo Großbuchstabe fehlt, einen wo Sonderzeichen fehlt – um beide Regeln zu verifizieren.)
TC7: Passwort und Bestätigung unterschiedlich – Eingabe: { username: "NewUser", email: "new@example.com", password: "Abcdef1!", passwordConfirm: "Abcdef1?"}. Erwartung: Fehler passwordConfirm = "Passwörter stimmen nicht überein.".
TC8: Gültige Registrierung – Eingabe: { username: "UniqueUser", email: "unique@example.com", password: "Abcdef1!", passwordConfirm: "Abcdef1!"} bei dem weder Username noch Email existieren. Erwartung: Erfolgreiche Validierung, keine Fehler (Test sollte kontrollieren, dass errors.isEmpty() true ist, bzw. bei Integrationstest Status 200 kommt).
TC9: Login ohne Benutzername – Eingabe: { username: "", password: "somepass"}. Erwartung: Fehler username = "Benutzername oder E-Mail ist erforderlich.".
TC10: Login ohne Passwort – Eingabe: { username: "User", password: ""}. Erwartung: Fehler password = "Passwort ist erforderlich.".
TC11: Login gültig (nur Validierung) – Eingabe: { username: "UserOrEmail", password: "somepass"}. Erwartung: keine Validierungsfehler (Status 200 von Dummy-Handler). (Ob die Kombination wirklich stimmt, testet man an anderer Stelle – hier geht es nur um die Validatoren.)
Diese Testfälle decken die häufigsten Szenarien ab, sowohl Erfolgspfad als auch diverse Fehlersituationen. Es ist wichtig, jede einzelne Validierungsregel mindestens einmal auszulösen, um sicherzustellen, dass die entsprechende Fehlermeldung und Logik greift.
Werkzeuge für Tests
Jest: Für Unit-Tests und Integrationstests in Node.js ist Jest sehr empfehlenswert. Jest kann asynchrone Tests sehr gut handhaben (z. B. mit await supertest(...)) und bietet ein benutzerfreundliches Assertion-API. Man kann die oben genannten Eingaben als verschiedene Testfälle (test(...) oder it(...) Blöcke) formulieren und mit expect() prüfen, ob errors.array() die erwarteten Inhalte hat bzw. ob der HTTP-Response den erwarteten Status/Body hat.
Supertest: Supertest ist ein Modul, das HTTP-Requests gegen eine Express-App senden kann, ohne dass diese tatsächlich auf einem Port lauschen muss. Es integriert sich gut mit Jest. Für unsere Zwecke kann man eine Testinstanz der Express-App oder des Routers erzeugen, die Validatoren inkludiert, und dann mit supertest(app).post('/register').send(testData) einen Request schicken. Anschließend prüft man die Response (.expect(400) etc. und den Response-Body). Dies ist ideal, um das Zusammenspiel von Middleware und Route End-to-End zu testen.
Sinon/Faker (bei Unit Tests mit DB): Da unsere Validatoren die Datenbank abfragen, ist es für echte Unit-Tests ratsam, diese Aufrufe zu simulieren. Man kann z. B. mit sinon das User.findOne stubben, um verschiedene Rückgaben zu erzwingen (z. B. ein Dummy-Userobjekt für "Benutzer existiert" vs. null für "Benutzer nicht gefunden"). Alternativ kann man in einer Testumgebung eine SQLite-Datenbank im Memory nutzen und mit Sequelize ein paar Datensätze anlegen, um realistisch zu testen. Für reine Integrationstests kann man auch einen speziellen Test-Datenbank-Schema verwenden.
Test-DB vorbereiten/aufräumen: Wenn Integrationstests die DB einbeziehen (z. B. tatsächlich ein User einfügen, um den "schon vergeben"-Fall zu testen), sollte man in den Test-Suite-Hooks (z. B. Jest beforeAll, afterEach) dafür sorgen, dass die benötigten Tabellen leer sind oder definierte Inhalte haben. Ggf. kann man mittels Sequelize die Modelle synchronisieren und Einträge anlegen/löschen für die Tests.
Mit diesen Tools und Vorgehensweisen kann man sicherstellen, dass die Validatoren wie erwartet funktionieren. Die Tests dienen zudem als lebende Dokumentation der Anforderungen (sie zeigen, welche Eingaben gültig sein sollten und welche nicht). Insbesondere Grenzfälle (edge cases) wie "leerer String vs Feld fehlt" bei optionalen Feldern oder komplexe Passwortbedingungen sollte man in Tests festhalten.
Fazit: Mit dem obigen Umsetzungsplan wird Ticket 0005 strukturiert angegangen. Wir haben die Installation und Gründe für express-validator dargelegt, ein ausführliches Konzept für die Implementierung der Validatoren (inklusive Custom-Logic mit Sequelize) entworfen, Best Practices und potenzielle Stolperfallen beleuchtet sowie anhand eines Codebeispiels und Testfällen gezeigt, wie die Lösung konkret auszusehen hat. Dieser Plan dient als Leitfaden für die Entwicklung und hilft dem Team, eine robuste, wartbare Validierungslogik für die Authentifizierungsprozesse von PokeTogetherBrowser zu