Umsetzungsplan für Ticket 0006: Authentifizierungsrouten (authRoutes.js)
Dieses Ticket umfasst das Anlegen aller Authentifizierungs-Endpunkte in einer eigenen Express-Router Datei (server/routes/authRoutes.js). Ziel ist es, die API-Routen für Registrierung, Login, Logout und aktuellen Benutzer zu definieren und mit den passenden Controller-Funktionen und Middleware zu verknüpfen. Dabei bauen wir auf den vorherigen Tickets auf: Der Auth-Controller aus Ticket 0003 stellt die Funktionen register, login, logout und getCurrentUser bereit. Die Authentifizierungs-Middleware authenticate aus Ticket 0004 wird zum Schutz sensibler Routen verwendet. Optional können die Validierungs-Middleware registerValidator und loginValidator aus Ticket 0005 vorgeschaltet werden, um Eingaben zu prüfen. Im Folgenden werden die Umsetzungsschritte, Best Practices, häufige Fehler sowie ein Code-Grundgerüst dargestellt.
Schritt-für-Schritt-Vorgehen zur Implementierung von authRoutes.js
Datei erstellen: Lege die Datei server/routes/authRoutes.js an (falls nicht bereits geschehen). Dies ist die zentrale Stelle, an der wir alle Authentifizierungsrouten bündeln.
Benötigte Module importieren: Importiere Express und die relevanten Module aus den vorherigen Tickets:
Express-Router: const express = require('express');
Authentifizierungs-Controller: const authController = require('../controllers/authController'); – Dieser Controller (Ticket 0003) liefert die Handler-Funktionen register, login, logout und getCurrentUser.
Middleware: const { authenticate } = require('../middleware/authMiddleware'); – Die authenticate-Middleware (Ticket 0004) wird zum Absichern geschützter Routen verwendet.
(Optional) Validatoren: const { registerValidator, loginValidator } = require('../validators/authValidators'); – Diese Validatoren (Ticket 0005) prüfen die Request-Daten und werden bei Registrierung und Login eingesetzt, falls verfügbar. (Stelle sicher, dass die require-Pfade korrekt auf die vorhandenen Dateien verweisen.)
Express-Router initialisieren: Richte einen neuen Router ein, um die Routen darauf zu registrieren:
javascript
Copy
const router = express.Router();
Dadurch erstellen wir eine Mini-Anwendung für unsere Auth-Routen, die später in die Haupt-App eingebunden wird.
Routen definieren: Lege alle erforderlichen Endpunkte auf dem Router fest. Für jede Route wird eine Middleware-Kette definiert, die nacheinander durchlaufen wird (z.B. zuerst Validator, dann Authenticate, dann Controller). Die folgenden Routen sind zu implementieren:
POST */register – Registrierung: Diese Route nimmt Registrierungsanfragen entgegen​
file-3n4ji6qetyfa53fftjgbxp
. (Optional: zuerst registerValidator zur Validierung der Eingabedaten ausführen.)* Anschließend ruft sie den Controller authController.register (Ticket 0003) auf, der die Registrierungslogik ausführt. Bei Fehlern im Validator wird die Anfrage mit Status 400 abgelehnt, andernfalls erstellt der Controller den neuen Benutzer und gibt eine Antwort zurück​
file-3n4ji6qetyfa53fftjgbxp
.
POST */login – Login: Diese Route dient dem Einloggen eines bestehenden Nutzers​
file-3n4ji6qetyfa53fftjgbxp
. (Optional: loginValidator als erste Middleware zur Prüfung der Login-Daten.)* Dann wird authController.login ausgeführt, der die Anmeldedaten überprüft und bei Erfolg z.B. ein JWT im Cookie sendet. Der Controller gibt eine Erfolgsmeldung oder Fehlermeldung zurück.
POST */logout – Logout: Dieser Endpunkt wird vom Client aufgerufen, um einen Logout durchzuführen​
file-3n4ji6qetyfa53fftjgbxp
. Wichtig: Hier muss vor dem Controller die authenticate-Middleware laufen, um sicherzustellen, dass nur ein eingeloggter Nutzer sich ausloggen kann. Die Middleware validiert z.B. das JWT im Cookie und stellt sicher, dass req.player (oder der Benutzerkontext) verfügbar ist. Anschließend löscht authController.logout die Session oder das Token und sendet die Bestätigung zurück.
GET */me – aktueller Benutzer: Über diese Route kann der Client die Daten des aktuell angemeldeten Benutzers abfragen (z.B. um das Profil oder die Sitzung zu überprüfen)​
file-3n4ji6qetyfa53fftjgbxp
. Auch hier ist authenticate erforderlich, um die Anfrage abzufangen und das JWT zu prüfen​
file-3n4ji6qetyfa53fftjgbxp
. Ist der Nutzer authentifiziert, ruft der Controller authController.getCurrentUser die aktuellen Benutzerdaten (aus req.player oder der Datenbank) ab und liefert sie als Antwort zurück. Andernfalls hat die Middleware bereits mit Status 401 (Unauthorized) geantwortet und die Kette abgebrochen​
file-3n4ji6qetyfa53fftjgbxp
.
Jede Route wird also mit einer oder mehreren Middleware-Funktionen definiert. Zuerst kommen (falls eingesetzt) die Validatoren, dann die Authentifizierungs-Middleware authenticate für geschützte Routen, und schließlich die entsprechende Controller-Funktion, welche die eigentliche Logik enthält. Diese Reihenfolge stellt sicher, dass zuerst Eingaben geprüft, dann Zugriffsschutz gewährleistet und zuletzt die Aktion ausgeführt wird.
Router exportieren: Am Ende der Datei muss der konfigurierte Router exportiert werden, damit er in der Hauptanwendung verwendet werden kann:
javascript
Copy
module.exports = router;
Damit ist authRoutes.js fertig implementiert und kann von der Haupt-App eingebunden werden.
Durch diese Schritte entsteht eine modular aufgebaute Router-Datei, in der alle Authentifizierungsrouten zentral definiert sind. Wichtig ist, dass die Pfade hier relativ (ohne den Prefix /api/auth) angegeben werden – der Prefix wird erst beim Einbinden des Routers in der Hauptanwendung vorangestellt (siehe Best Practices unten).
Best Practices für Routen, Middleware und Struktur
Bei der Implementierung von authRoutes.js sollten einige bewährte Praktiken beachtet werden, um sauberen, wartbaren Code zu erhalten:
Konsistenter URL-Präfix: Definiere die Routen in dieser Datei ohne den gemeinsamen Präfix, da dieser beim Einbinden hinzugefügt wird. Beispielsweise wird der Router später unter /api/auth gemountet, daher verwenden wir hier Pfade wie /register, /login etc., ohne /api/auth davor​
file-3n4ji6qetyfa53fftjgbxp
. So bleiben die Routen in authRoutes.js übersichtlich, und der komplette Pfad ergibt sich durch die Einbindung (siehe Integration unten).
Reihenfolge der Middleware: Die Abfolge der Middleware-Funktionen in einer Route ist entscheidend. Validierungs-Middleware sollte vor der Authentifizierung ausgeführt werden, damit ungültige Anfragen frühzeitig abgewiesen werden. Danach folgt die Authentifizierungs-Middleware authenticate (falls die Route geschützt ist), dann evtl. Autorisierungs-Middleware (falls später Rollen/ Rechte geprüft werden müssten), und als letztes der Controller-Handler, der die Hauptlogik ausführt​
file-3n4ji6qetyfa53fftjgbxp
. Diese Reihenfolge garantiert, dass jede Anfrage die nötigen Prüfschritte durchläuft, bevor die Kernlogik ausgeführt wird.
Korrekte HTTP-Methoden verwenden: Achte darauf, dass die HTTP-Methoden mit der Semantik der Route übereinstimmen. POST sollte für Aktionen genutzt werden, die Daten erzeugen oder verändern (wie Registrierung, Login, Logout), während GET zum Abrufen von Daten dient (aktueller Benutzer)​
file-3n4ji6qetyfa53fftjgbxp
. Falsche Methoden führen zu Verwirrung und können z.B. das Frontend in der Kommunikation mit dem Backend stören.
Sinnvolle Pfadnamen (Ressourcen-Benennung): Verwende etablierte Konventionen für Endpunkt-Namen. In Auth-APIs haben sich Pfade wie /register, /login, /logout und /me bzw. /current durchgesetzt​
file-3n4ji6qetyfa53fftjgbxp
. Diese sind selbsterklärend und erleichtern anderen Entwicklern das Verständnis der API. Zudem sollten Pfade klein geschrieben und möglichst kurz gehalten sein.
Modularität durch Router-Struktur: Halte die Routen-Definition getrennt von der Hauptanwendung. Durch die Nutzung von express.Router() und einer eigenen Datei für Auth-Routen bleibt der Code modular. Dies vereinfacht Wartung und Tests, da Authentifizierungslogik isoliert behandelt wird. Außerdem können so ähnliche Routen (z.B. alle beginnend mit /auth) gruppiert und gemeinsam eingebunden werden, was Überschneidungen mit anderen Routen vermeidet.
Häufige Fehler und Probleme bei der Umsetzung
Bei der Implementierung der Authentifizierungsrouten können einige typische Stolpersteine auftreten. Hier sind häufige Fehlerquellen und wie man sie vermeidet:
Falsche Pfade oder HTTP-Methoden: Ein häufiger Fehler ist, dass der Client und der Server nicht die exakt gleichen Endpunkte verwenden. Beispielsweise schickt der Client die Anfrage an /api/auth/register, aber der Server horcht auf einem anderen Pfad oder falschen HTTP-Methoden. Stelle sicher, dass Pfad und Methode exakt übereinstimmen​
file-3n4ji6qetyfa53fftjgbxp
 (z.B. POST vs. GET, oder /api/auth/me vs. /me im Router, siehe Präfix oben).
Fehlende Middleware bei geschützten Routen: Wird die authenticate-Middleware bei sensiblen Routen wie /logout oder /me vergessen, kann ein nicht-eingeloggter Nutzer unberechtigt auf diese Ressourcen zugreifen​
file-3n4ji6qetyfa53fftjgbxp
. Achte also darauf, die Middleware vorzuschalten, damit unautorisierte Zugriffe mit HTTP 401 abgewehrt werden.
Falsche Middleware-Reihenfolge: Wenn Middleware in der falschen Reihenfolge registriert wird, kann dies zu unerwartetem Verhalten führen​
file-3n4ji6qetyfa53fftjgbxp
. Z.B. die Auth-Middleware muss vor dem Controller stehen – ansonsten würde der Controller ausgeführt, bevor die Authentifizierung geprüft ist. Ebenso sollten Validatoren vor dem Controller laufen, damit bei ungültigen Daten der Controller gar nicht erst aufgerufen wird.
Import-/Pfadfehler: Beim require() der Module können falsche Pfadangaben zu Fehlern führen. Überprüfe, dass die Import-Pfade stimmen (relative Pfade vom aktuellen Dateistandort). Ein häufiger Fehler ist ein falscher Verzeichnispfad, z.B. require('./controllers/authController') statt require('../controllers/authController'). Tipp: die Anzahl der ../ im Pfad muss der Ordnerstruktur entsprechen. Ebenso achte auf die Dateinamen (Groß-/Kleinschreibung) und exportierte Bezeichner (z.B. { authenticate } genau so importieren, wie im Modul exportiert).
Router nicht exportiert oder nicht eingebunden: Vergisst man module.exports = router, steht der Router der Hauptanwendung nicht zur Verfügung. Ebenso, falls man vergisst, den Router in server/index.js mit app.use einzubinden, bleiben die Endpunkte ohne Funktion. (Dies gehört zwar teilweise zu Ticket 0007, sollte aber im Hinterkopf behalten werden.)
Durch sorgfältiges Überprüfen dieser Punkte kann man viele der typischen Fehler vermeiden und sicherstellen, dass die Authentifizierungsrouten auf Anhieb funktionieren.
Code-Grundgerüst für authRoutes.js
Im Folgenden ein mögliches Grundgerüst der Datei server/routes/authRoutes.js. Der Code ist kommentiert, um die Funktion jeder Komponente zu erläutern. Dieses Gerüst setzt voraus, dass Ticket 0003 (Controller), Ticket 0004 (Middleware) und optional Ticket 0005 (Validatoren) abgeschlossen sind:
javascript
Copy
// Import von Express und weiteren Modulen
const express = require('express');
const router = express.Router();

// Controller und Middleware aus vorherigen Tickets importieren
const authController = require('../controllers/authController');  // Ticket 0003: enthält register, login, logout, getCurrentUser
const { authenticate } = require('../middleware/authMiddleware'); // Ticket 0004: Middleware zum JWT-/Session-Check
// Optional: Validatoren aus Ticket 0005 (falls implementiert)
const { registerValidator, loginValidator } = require('../validators/authValidators'); 

// Route: Registrierung eines neuen Users
// Optional Validator vorschalten (registerValidator) zur Prüfung von req.body
router.post('/register', /* registerValidator, */ authController.register);

// Route: Login eines Users (Session/Token erstellen)
// Optional Validator (loginValidator) zur Prüfung von Logindaten
router.post('/login', /* loginValidator, */ authController.login);

// Route: Logout des aktuellen Users (Session/Token beenden)
// Geschützt durch authenticate-Middleware (nur eingeloggte Benutzer)
// Controller löscht z.B. das JWT-Cookie oder die Session
router.post('/logout', authenticate, authController.logout);

// Route: Aktuellen (eingeloggten) Benutzer abfragen
// Geschützt durch authenticate-Middleware 
// Controller liest `req.player` (vom Middleware gesetzt) und gibt User-Daten zurück
router.get('/me', authenticate, authController.getCurrentUser);

// Router exportieren, damit er in der Hauptanwendung eingebunden werden kann
module.exports = router;
Hinweise: In diesem Code sind registerValidator und loginValidator als Kommentar eingetragen – falls diese Middleware-Funktionen vorhanden sind, sollten sie ohne Kommentar eingefügt werden, damit sie bei den jeweiligen Routen greifen. Die Pfade der Routen (/register, /login, etc.) sind relativ definiert; der endgültige Pfad erhält in der Hauptanwendung noch den Präfix (siehe unten). Jede Route nutzt die entsprechenden Controller-Methoden aus dem authController als abschließenden Handler. Die Logout- und Me-Routen verwenden authenticate als vorgelagerte Middleware, um unberechtigte Zugriffe abzufangen.
Dieses Grundgerüst kann als Ausgangspunkt dienen. Je nach den im Projekt vorhandenen Dateien kann es nötig sein, die Import-Pfade (require(...)) an die tatsächliche Verzeichnisstruktur anzupassen (z.B. authMiddleware.js vs. middleware/index.js usw.). Kommentare im Code helfen Teammitgliedern, die Funktionsweise jeder Route nachzuvollziehen.
Integration in die Hauptanwendung (server/index.js)
Die definierte Router-Konfiguration muss nun noch in die Express-Hauptanwendung integriert werden (dies wird in Ticket 0007 umgesetzt). In der Datei server/index.js (bzw. der zentralen Server-Datei) wird der Auth-Router mittels app.use() eingebunden. Dabei wird typischerweise der Pfad-Präfix /api/auth festgelegt, unter dem alle Routen aus authRoutes.js erreichbar sind​
file-3n4ji6qetyfa53fftjgbxp
. Zum Beispiel könnte in server/index.js folgender Code hinzugefügt werden:
javascript
Copy
const authRoutes = require('./routes/authRoutes');   // Router importieren
app.use('/api/auth', authRoutes);                    // Router unter Präfix einbinden
Dadurch werden die in authRoutes.js definierten Endpunkte tatsächlich aktiv. Ein Request vom Client an POST /api/auth/register wird nun von Express an die entsprechende Route im Auth-Router weitergeleitet (die intern auf POST /register hört). Wichtig: Diese Integration sollte nur einmal und an zentraler Stelle erfolgen (meist direkt nach Initialisierung von app). Nach Ticket 0007 ist die Authentifizierungs-API damit voll in die Anwendung eingebunden.
Mit diesem Plan lässt sich Ticket 0006 strukturiert umsetzen. Alle erforderlichen Routen sind definiert und mit den bestehenden Controller- und Middleware-Komponenten verknüpft. Unter Beachtung der genannten Best Practices und durch Vermeiden der häufigen Fehler sollte die Implementierung reibungslos funktionieren und die Grundlage für die weiteren Tickets (z.B. Integration in index.js und spätere Features) legen.