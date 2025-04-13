Implementierungsplan: Ticket 0007 - Server-Integration & Bereinigung für JWT/Cookie-Authentifizierung
I. Einleitung
Zweck
Dieser Bericht beschreibt den detaillierten Implementierungsplan für Ticket 0007 im Rahmen des PokeTogetherBrowser-Projekts. Das Kernziel dieses Tickets ist die Integration des neu entwickelten Authentifizierungssystems, das auf JSON Web Tokens (JWT) und Cookies basiert (erstellt in den Tickets 0001, 0004 und 0006), in die zentrale Serverdatei (server/index.js). Parallel dazu erfolgt die vollständige Entfernung der veralteten, Session-basierten Authentifizierungslogik.

Bedeutung
Die Umsetzung von Ticket 0007 stellt einen kritischen Meilenstein dar. Das bestehende, als unsicher und zustandsbehaftet identifizierte Session-System (eine Diskrepanz, die in der Projektübersicht festgestellt wurde) wird durch einen standardisierten, serverseitig zustandslosen JWT-Ansatz ersetzt. Diese Umstellung ist nicht nur eine Bereinigung, sondern legt das Fundament für die sichere Implementierung aller nachfolgenden Spielfunktionen, die eine zuverlässige Benutzerauthentifizierung erfordern. Ohne diese solide Basis wären Features wie das Speichern von Spielständen oder Interaktionen zwischen Spielern anfällig für Sicherheitsprobleme.   

Geltungsbereich
Der Fokus dieses Plans liegt ausschließlich auf den Modifikationen innerhalb der Datei server/index.js. Dies umfasst die Einbindung der vorausgesetzten, in anderen Tickets erstellten Komponenten (Middleware, Routen), die Konfiguration notwendiger Bibliotheken (cookie-parser) und die systematische Entfernung aller Code-Artefakte, die zur alten Session-Logik gehörten. Die Implementierung der abhängigen Komponenten selbst (z.B. die Logik des AuthController oder der authenticate-Middleware) wird als abgeschlossen vorausgesetzt.

II. Voraussetzungen & Setup
Bestätigung der Abhängigkeiten
Vor Beginn der Implementierung muss sichergestellt sein, dass die folgenden Komponenten aus den abhängigen Tickets erfolgreich abgeschlossen wurden und im Projekt verfügbar sind:

Ticket 0001: Das cookie-parser-Paket muss via npm oder yarn installiert sein. Dieses Paket ist unerlässlich für das Auslesen von Cookies aus HTTP-Anfragen.   
Ticket 0004: Die Logik der Authentifizierungs-Middleware, insbesondere die Funktion authenticate (oder eine äquivalente Funktion), muss implementiert sein. Diese Funktion ist verantwortlich für die Validierung des JWT aus dem Cookie bei HTTP-Anfragen und befindet sich typischerweise in einer Datei wie server/middleware/authMiddleware.js.
Ticket 0006: Die Authentifizierungs-Routen (Login, Registrierung, Logout etc.) müssen mittels eines Express Routers definiert sein. Diese Routen-Definition befindet sich üblicherweise in einer Datei wie server/routes/authRoutes.js.
Essentielle Importe in server/index.js
Die folgenden Module müssen am Anfang der Datei server/index.js importiert werden, um die notwendigen Funktionalitäten bereitzustellen:

JavaScript

// Standard Node.js und Express Module (bereits vorhanden)
const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Socket.IO Server Klasse

// Neu hinzuzufügende oder zu überprüfende Importe für Ticket 0007
const cookieParser = require('cookie-parser'); // Zum Parsen von Cookie-Headern [1]
const cors = require('cors'); // Für Cross-Origin Resource Sharing (wahrscheinlich benötigt) [3, 4]
const jwt = require('jsonwebtoken'); // Zur Verifizierung von JWTs in der Socket.io Middleware [1, 5, 6]
const db = require('./models'); // Sequelize Instanz und Modelle (für DB-Zugriff in Socket.io Middleware)
const authConfig = require('./config/auth'); // Enthält JWT_SECRET und ggf. weitere Konfigurationen (Pfad anpassen) [1, 7]
const authRoutes = require('./routes/authRoutes'); // Der Router für /api/auth Endpunkte (Pfad anpassen)
Es ist sicherzustellen, dass die Pfade zu ./models, ./config/auth und ./routes/authRoutes korrekt sind und der Struktur des Projekts entsprechen.

III. Express Middleware-Integration & Bereinigung
Die folgenden Schritte beschreiben die Integration der neuen Komponenten in die Express-Anwendung (webApp) und die Entfernung der alten Logik.

A. Integration der cookie-parser-Middleware
Aktion: Fügen Sie die cookie-parser-Middleware zur Express-App hinzu:
JavaScript

const webApp = express();
//... andere globale Middleware wie CORS, Body Parser...
webApp.use(cookieParser());
//...
Platzierung: Die korrekte Platzierung dieser Middleware ist entscheidend. webApp.use(cookieParser()); muss vor allen Routen oder Middlewares aufgerufen werden, die auf req.cookies zugreifen müssen. Dies betrifft insbesondere die authRoutes und jegliche andere Route, die durch die authenticate-Middleware (aus Ticket 0004) geschützt wird. Typischerweise erfolgt die Einbindung nach der Initialisierung von express() und globalen Middlewares wie cors() oder express.json(), aber vor der Definition der Anwendungsrouten.
Begründung: Die cookie-parser-Middleware analysiert den Cookie-Header eingehender HTTP-Anfragen und füllt das req.cookies-Objekt mit den gefundenen Schlüssel-Wert-Paaren. Die authenticate-Middleware (Ticket 0004) benötigt Zugriff auf dieses Objekt, um das JWT-Cookie (z.B. req.cookies.token) auszulesen und zu validieren. Da Express Middlewares sequenziell abarbeitet, führt eine zu späte Einbindung von cookie-parser dazu, dass req.cookies zum Zeitpunkt der Ausführung der authenticate-Middleware noch undefined ist. Dies resultiert in fehlgeschlagenen Authentifizierungsversuchen, deren Ursache ohne Kenntnis dieser Abhängigkeit schwer zu diagnostizieren sein kann.   
B. Registrierung der Authentifizierungs-Routen
Aktion: Binden Sie den importierten authRoutes-Router unter dem Präfix /api/auth in die Express-Anwendung ein:
JavaScript

webApp.use('/api/auth', authRoutes);
Funktionalität: Diese Zeile weist Express an, alle HTTP-Anfragen, deren Pfad mit /api/auth beginnt (z.B. /api/auth/login, /api/auth/register), an den in authRoutes.js definierten Router weiterzuleiten. Dieser Router enthält die spezifischen Handler für die einzelnen Authentifizierungsoperationen, wie sie in Ticket 0006 implementiert wurden.
C. Entfernung veralteter Session-basierter API-Endpunkte
Aktion: Suchen Sie die alten Routen-Handler, die direkt in server/index.js für Pfade wie /api/login, /api/logout und /api/check-session definiert wurden, und löschen Sie diese vollständig.
JavaScript

// Beispielhaft zu entfernende Blöcke:
// webApp.post('/api/login', (req, res) => { /* Alte Session-Logik... */ }); // <-- LÖSCHEN
// webApp.post('/api/logout', (req, res) => { /* Alte Session-Logik... */ }); // <-- LÖSCHEN
// webApp.post('/api/check-session', (req, res) => { /* Alte Session-Logik... */ }); // <-- LÖSCHEN
Begründung: Diese Endpunkte implementierten die alte, unsichere und zustandsbehaftete Session-Logik. Ihre Funktionalität wird nun vollständig durch die neuen, JWT-basierten Endpunkte unter /api/auth abgedeckt, die durch authRoutes bereitgestellt werden. Das Beibehalten der alten Endpunkte führt zu unnötigem Code ("Code Smell"), potenziellen Routing-Konflikten und stellt ein Sicherheitsrisiko dar, da die alte Logik weiterhin erreichbar wäre. Die Entfernung erzwingt den Übergang zum neuen System und verbessert die Wartbarkeit.
D. Entfernung der globalen Session-Zustandsverwaltung
Aktion: Identifizieren und löschen Sie alle globalen Variablen, die zur Verwaltung des alten Session-Systems verwendet wurden. Dies umfasst typischerweise Objekte zur Speicherung von Session-Daten und Mappings zwischen Session-IDs und Sockets. Löschen Sie ebenfalls alle zugehörigen Hilfsfunktionen.
JavaScript

// Beispielhaft zu entfernende Definitionen:
// let sessions = {}; // <-- LÖSCHEN
// let sessionToSocket = {}; // <-- LÖSCHEN
// let socketToSession = {}; // <-- LÖSCHEN
//
// function generateSessionId() { /*... */ } // <-- LÖSCHEN
Begründung: Ein wesentlicher Vorteil von JWT ist die serverseitige Zustandslosigkeit bezüglich der Session-Daten. Der Server muss keine Informationen über aktive Benutzersitzungen mehr im Speicher vorhalten. Der Zustand ist im Token selbst enthalten, das auf der Client-Seite gespeichert wird (typischerweise in einem Cookie). Die Entfernung dieser globalen Variablen und Funktionen vereinfacht die Serverlogik erheblich, reduziert den Speicherverbrauch und eliminiert die Skalierungsprobleme, die mit In-Memory-Session-Speichern verbunden sind, insbesondere in Umgebungen mit mehreren Serverinstanzen. Es ist jedoch wichtig zu verstehen, dass "zustandslos" im Kontext von JWT primär bedeutet, dass der Server keine Session-Daten speichern muss. Die Verifizierung des Tokens bei jeder Anfrage kann dennoch eine zustandsbehaftete Operation erfordern, wie z.B. eine Datenbankabfrage, um den Benutzerstatus oder Berechtigungen zu prüfen. Dies ist ein wichtiger Aspekt, um die Sicherheitsimplikationen, insbesondere bei der Token-Invalidierung, korrekt zu bewerten.   
Authentifizierungslogik: Alt vs. Neu
Die folgende Tabelle fasst die wesentlichen Unterschiede zwischen der alten und der neuen Authentifizierungslogik zusammen, wie sie durch Ticket 0007 umgesetzt werden:

Merkmal	Alte Session-basierte Implementierung (server/index.js)	Neue JWT/Cookie-basierte Implementierung (server/index.js & Abhängigkeiten)	Status
HTTP Auth Zustand	Globales sessions-Objekt (In-Memory)	JWT gespeichert im clientseitigen Cookie (HttpOnly, Secure, SameSite)	Ersetzt
HTTP Auth Verif.	Nachschlagen von sessionId im sessions-Objekt	authenticate-Middleware (Ticket 0004) liest Cookie via req.cookies (durch cookie-parser), verifiziert JWT	Ersetzt
Cookie Parsen	Potenziell manuell oder via express-session	cookie-parser-Middleware	Integriert
HTTP Endpunkte	/api/login, /api/logout, /api/check-session direkt definiert	/api/auth/* behandelt durch authRoutes (Ticket 0006)	Ersetzt
Socket Auth Zustand	sessionId übergeben (z.B. Query - unsicher), Mapping via sessionToSocket	JWT übergeben via socket.handshake.auth.token	Ersetzt
Socket Auth Verif.	Alte io.use-Middleware prüft sessionId gegen sessions	Neue io.use-Middleware verifiziert JWT, prüft DB, hängt socket.player an	Ersetzt
Socket Benutzerdaten	Abruf via sessionId-Lookup in Handlern	Zugriff über socket.player-Objekt	Ersetzt
Session Variablen	sessions, sessionToSocket, socketToSession, generateSessionId	Keine	Entfernt

In Google Sheets exportieren
Diese Gegenüberstellung verdeutlicht den Übergang von einer zentralisierten, speicherintensiven Session-Verwaltung zu einem verteilten, Cookie-basierten Ansatz mit serverseitiger Verifizierung über JWT. Sie dient als Checkliste, um sicherzustellen, dass alle Aspekte der alten Logik adressiert und durch die neuen Mechanismen ersetzt werden.

IV. Überarbeitung der Socket.io-Authentifizierung
Die Authentifizierung für Echtzeit-Verbindungen über Socket.io muss ebenfalls vollständig auf das JWT-System umgestellt werden.

A. Ersetzen der alten io.use-Middleware
Aktion: Lokalisieren Sie den vorhandenen io.use((socket, next) => {... });-Block. Dieser Block enthielt wahrscheinlich die Logik zur Validierung eingehender Verbindungen basierend auf der alten sessionId. Löschen oder kommentieren Sie diesen gesamten Block aus.
Begründung: Diese Middleware setzte das alte Authentifizierungsschema durch und ist mit dem neuen JWT-Ansatz inkompatibel und somit obsolet.
B. Implementierung der neuen JWT-basierten io.use-Middleware
Aktion: Fügen Sie einen neuen io.use(async (socket, next) => {... });-Block hinzu. Diese Middleware-Funktion wird bei jedem Versuch eines Clients, eine Socket.io-Verbindung herzustellen, ausgeführt, und zwar bevor das eigentliche connection-Ereignis auf dem Server ausgelöst wird.   

Kernlogik innerhalb der io.use-Middleware:

Token-Extraktion: Das JWT wird vom Client erwartet. Die Standardmethode bei Socket.io ist die Übermittlung im auth-Objekt während der Verbindungsinitialisierung. Unsichere Methoden wie die Übergabe via Query-Parameter sollten vermieden werden.
JavaScript

const token = socket.handshake.auth.token;
  
Prüfung auf Token-Vorhandensein: Wenn kein Token übermittelt wurde, wird die Verbindung sofort abgelehnt. Das Übergeben eines Error-Objekts an next() signalisiert den Fehler.
JavaScript

if (!token) {
  console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Kein Token übermittelt.`);
  return next(new Error('Nicht authentifiziert: Kein Token'));
}
  
JWT-Verifizierung: Verwenden Sie jwt.verify, um die Signatur und die Gültigkeit (insbesondere das Ablaufdatum exp) des Tokens anhand des JWT_SECRET aus authConfig zu überprüfen. Dieser Vorgang sollte in einem try...catch-Block gekapselt werden, um Fehler bei der Verifizierung (ungültige Signatur, abgelaufenes Token) abzufangen.
JavaScript

try {
  const decoded = jwt.verify(token, authConfig.JWT_SECRET);
  //... fortfahren bei Erfolg
} catch (error) {
  //... Fehlerbehandlung...
}
  
Datenbankvalidierung: Nach erfolgreicher Token-Dekodierung wird die Benutzer-ID (typischerweise im id- oder sub-Claim des Tokens enthalten, hier decoded.id) verwendet, um den zugehörigen Spielerdatensatz in der Datenbank über das Player-Modell zu suchen (db.Player.findByPk). Diese Prüfung ist entscheidend, um sicherzustellen, dass der Benutzerkonto noch existiert und aktiv ist (z.B. über ein is_active-Flag). Es sollten nur die tatsächlich benötigten Felder selektiert werden, um die Abfrage effizient zu halten und keine unnötigen Daten (wie den Passwort-Hash) zu laden.
JavaScript

const player = await db.Player.findByPk(decoded.id, {
  attributes: ['id', 'username', 'role', 'is_active'] // Nur benötigte Felder
});

if (!player ||!player.is_active) {
  console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Ungültiger Spieler (ID: ${decoded.id}) oder inaktiv.`);
  return next(new Error('Nicht authentifiziert: Ungültiger Spieler'));
}
  
Anhängen von Benutzerdaten an den Socket: Bei erfolgreicher Verifizierung und Datenbankprüfung werden relevante, nicht-sensitive Benutzerinformationen an das socket-Objekt angehängt. Diese Daten stehen dann in allen nachfolgenden Event-Handlern für diesen spezifischen Socket zur Verfügung.
JavaScript

socket.player = { id: player.id, username: player.username, role: player.role };
console.log(`Socket Auth erfolgreich für <span class="math-inline">\{socket\.player\.username\} \(</span>{socket.id})`);
  
Verbindung erlauben: Durch den Aufruf von next() ohne Fehlerargument wird die Authentifizierung als erfolgreich markiert und der Verbindungsprozess fortgesetzt, was schließlich zum Auslösen des connection-Events führt.
JavaScript

next();
  
Fehlerbehandlung: Im catch-Block (für jwt.verify-Fehler) oder bei fehlgeschlagenem DB-Lookup wird next() mit einem Error-Objekt aufgerufen, um die Verbindung abzulehnen. Es ist sinnvoll, spezifische Fehlermeldungen zu generieren, die dem Client übermittelt werden. Beispielsweise kann zwischen einem abgelaufenen Token (TokenExpiredError) und einem generell ungültigen Token (JsonWebTokenError) unterschieden werden, um dem Benutzer klareres Feedback zu geben. Das Übergeben des Fehlers an next() löst auf Client-Seite das connect_error-Ereignis aus.
JavaScript

} catch (error) {
  console.error(`Socket Auth Fehler (${socket.id}):`, error.message);
  const clientErrorMessage = (error.name === 'TokenExpiredError' |
  
| error.name === 'JsonWebTokenError')
? 'Ungültiges oder abgelaufenes Token'
: 'Authentifizierungsfehler';
next(new Error(Nicht authentifiziert: ${clientErrorMessage})); // Verbindung ablehnen
}
```

Begründung: Diese io.use-Middleware fungiert als zentraler Authentifizierungs-Gatekeeper für alle eingehenden WebSocket-Verbindungen. Sie stellt sicher, dass nur Clients, die ein gültiges, nicht abgelaufenes JWT für einen existierenden und aktiven Benutzer vorweisen können, eine Verbindung herstellen dürfen. Sie kapselt die Authentifizierungslogik für Sockets an einer Stelle.

Zustandsbehaftung der Socket-Verbindung: Es ist wichtig zu verstehen, dass die io.use-Middleware die Authentifizierung nur beim Aufbau der Verbindung durchführt. Die einmal etablierte WebSocket-Verbindung ist ihrer Natur nach zustandsbehaftet. Die während der io.use-Phase an socket.player angehängten Benutzerdaten bleiben für die gesamte Lebensdauer dieser spezifischen Socket-Verbindung erhalten. Dies hat eine wichtige Konsequenz: Wenn das ursprüngliche JWT beispielsweise eine Gültigkeitsdauer von einer Stunde hatte, die WebSocket-Verbindung aber zwei Stunden offen bleibt, wird die Verbindung serverseitig weiterhin als "authentifiziert" mit den initialen socket.player-Daten betrachtet, obwohl das Token technisch abgelaufen ist. Aktionen, die über diesen Socket nach Ablauf des JWTs ausgeführt werden, basieren weiterhin auf den initial zwischengespeicherten Benutzerdaten. Wenn eine strikte Einhaltung der Token-Gültigkeit oder eine sofortige Invalidierung (z.B. bei Logout auf einem anderen Gerät) auch für langlebige Socket-Verbindungen erforderlich ist, müssen zusätzliche Mechanismen implementiert werden. Mögliche Ansätze sind das periodische Senden einer Re-Authentifizierungsanforderung vom Server, das erneute Prüfen der Datenbank bei kritischen Socket-Ereignissen oder das serverseitige Schließen von Verbindungen, deren ursprüngliches Token abgelaufen wäre. Dies unterscheidet sich grundlegend von reinen HTTP/JWT-Interaktionen, bei denen jede Anfrage typischerweise neu validiert wird, und stellt eine oft übersehene Sicherheitsüberlegung dar.   

V. Anpassung der Socket.io-Event-Handler
Die vorhandenen Handler für Socket.io-Ereignisse müssen angepasst werden, um das neue socket.player-Objekt zur Benutzeridentifikation zu verwenden, anstatt sich auf die entfernten Session-Variablen zu verlassen.

A. io.on('connection', (socket) => {... })
Aktion: Entfernen Sie jegliche Logik, die zuvor Benutzerinformationen basierend auf einer sessionId aus den alten globalen Variablen oder der Datenbank nachgeschlagen hat. Greifen Sie stattdessen direkt auf socket.player zu, das von der io.use-Middleware gesetzt wurde. Fügen Sie zur Sicherheit eine Überprüfung hinzu, ob socket.player tatsächlich existiert (obwohl dies durch io.use sichergestellt sein sollte). Protokollieren Sie die Verbindung unter Verwendung von socket.player.username. Verwenden Sie socket.player.id und socket.player.username für alle Aktionen, die die Identität des verbundenen Spielers erfordern, wie das Senden von "Spieler beigetreten"-Nachrichten oder das Laden initialer Spielerdaten.
Beispielhafte Anpassung (Ausschnitt):
JavaScript

io.on('connection', (socket) => {
  // Benutzerinformationen sind jetzt durch die io.use-Middleware verfügbar
  const playerInfo = socket.player;

  // Sicherheitsüberprüfung: Sollte nie fehlschlagen, wenn io.use korrekt implementiert ist
  if (!playerInfo) {
    console.error(`KRITISCH: socket.player nicht gefunden für Socket ${socket.id} nach erfolgreicher Auth-Middleware. Trenne Verbindung.`);
    socket.disconnect(true); // Verbindung sofort trennen
    return;
  }

  console.log(`Spieler verbunden: ${playerInfo.username} (ID: ${playerInfo.id}, Socket: ${socket.id})`);

  // Beispiel: Spieler einem spezifischen Raum hinzufügen
  socket.join(`player-${playerInfo.id}`);

  // Beispiel: Andere über den Beitritt informieren (ersetzt alte Logik)
  socket.broadcast.emit('player-joined', { username: playerInfo.username, id: playerInfo.id });

  //... Registrierung der anderen Event-Listener ('move', 'chat-message', etc.)...

  // Der 'disconnect'-Handler wird typischerweise innerhalb des 'connection'-Handlers definiert
  socket.on('disconnect', () => {
     // playerInfo ist hier über den Closure verfügbar, oder alternativ socket.player verwenden
     console.log(`Spieler getrennt: ${playerInfo.username} (ID: ${playerInfo.id}, Socket: ${socket.id})`);

     // Beispiel: Andere über das Verlassen informieren
     socket.broadcast.emit('player-left', { id: playerInfo.id });

     // --- ALTE SESSION-BEREINIGUNGSLOGIK ENTFERNEN ---
  });
});
B. socket.on('move', (pos) => {... })
Aktion: Fügen Sie am Anfang des Handlers eine Schutzbedingung hinzu: if (!socket.player) { console.warn(Move Event von nicht authentifiziertem Socket ${socket.id}); return; }. Verwenden Sie socket.player.id (bevorzugt, da eindeutiger und stabiler als username) für Datenbankaktualisierungen (z.B. UPDATE PlayerPositions SET... WHERE PlayerId =?) und socket.player.username oder socket.player.id beim Senden des player-moved-Ereignisses an andere Clients.
C. socket.on('chat-message', (message) => {... })
Aktion: Fügen Sie ebenfalls die Schutzbedingung if (!socket.player) { console.warn(Chat Event von nicht authentifiziertem Socket ${socket.id}); return; } hinzu. Verwenden Sie socket.player.username als Absender (sender) und socket.player.id als Absender-ID (senderId), wenn die Chat-Nachricht an andere Clients gesendet wird. Falls Chat-Nachrichten in der Datenbank gespeichert werden, sollte senderId (also socket.player.id) persistiert werden.
D. socket.on('disconnect', () => {... })
Aktion: Entfernen Sie jeglichen Code, der versucht hat, die alten globalen Session-Variablen (sessions, sessionToSocket, socketToSession) zu bereinigen. Passen Sie die Log-Nachricht an, um socket.player?.username zu verwenden. Die Verwendung von Optional Chaining (?.) ist hier ratsam, da das disconnect-Ereignis theoretisch ausgelöst werden könnte, bevor socket.player gesetzt wurde, falls die Verbindung während der Authentifizierungsphase in io.use abbricht. Verwenden Sie socket.player?.id beim Senden von player-left-Ereignissen.

Begründung für die Anpassungen: Diese Änderungen stellen sicher, dass alle über Socket.io ausgeführten Echtzeitaktionen korrekt dem authentifizierten Benutzer zugeordnet werden, der durch das JWT und das socket.player-Objekt identifiziert wird. Dies gewährleistet Datenintegrität und Konsistenz mit dem neuen Authentifizierungssystem. Die Schutzbedingungen (if (!socket.player)) verhindern, dass nicht authentifizierte Sockets (die es aufgrund der io.use-Middleware eigentlich nicht geben sollte) Aktionen ausführen können.

VI. Struktur der Code-Implementierung (server/index.js)
Die folgende konzeptionelle Struktur illustriert die Platzierung der neuen Komponenten und die Entfernung der alten Logik in server/index.js:

JavaScript

// server/index.js

// 1. Importe
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cookieParser = require('cookie-parser'); // <-- Integriert
const cors = require('cors');                 // <-- Wahrscheinlich benötigt
const jwt = require('jsonwebtoken');         // <-- Integriert
const db = require('./models');              // <-- Sicherstellen, dass vorhanden
const authConfig = require('./config/auth'); // <-- Integriert (Pfad anpassen)
const authRoutes = require('./routes/authRoutes'); // <-- Integriert (Pfad anpassen)
//... andere Importe...

// 2. Initialisierung von Express App und HTTP Server
const webApp = express();
const server = http.createServer(webApp);

// 3. Initialisierung des Socket.IO Servers & CORS Konfiguration
const io = new Server(server, {
  cors: {
    // WICHTIG: 'origin' an die Frontend-URL anpassen!
    origin: process.env.FRONTEND_URL |
| "http://localhost:3000", // Beispiel für Entwicklung
    methods:,
    // Erforderlich, wenn der Client Cookies mitsendet (z.B. für Socket-Auth-Token aus HttpOnly-Cookie)
    // oder wenn der Client 'withCredentials: true' verwendet.
    credentials: true, // [3, 4, 21]
    // allowedHeaders: ["my-custom-header"], // Nur wenn benutzerdefinierte Header verwendet werden [3, 4]
  }
});

// 4. Globale Express Middleware
// CORS für HTTP API (ggf. spezifischer konfigurieren als Socket.IO CORS)
webApp.use(cors({
    origin: process.env.FRONTEND_URL |
| "http://localhost:3000",
    credentials: true // Erforderlich für Cookie-basierte API-Authentifizierung
}));
webApp.use(express.json()); // Für JSON Request Bodies
webApp.use(express.urlencoded({ extended: true })); // Für URL-encoded Request Bodies
webApp.use(cookieParser()); // <-- Integriert: MUSS vor Routen stehen, die Cookies benötigen

// --- ENTFERNT: Alte globale Session-Variablen (sessions, sessionToSocket, etc.) ---
// --- ENTFERNT: Alte generateSessionId Funktion ---

// 5. API Routen Definition
// --- ENTFERNT: Alte Routen-Handler für /api/login, /api/logout, /api/check-session ---
webApp.use('/api/auth', authRoutes); // <-- Integriert: Neue Authentifizierungsrouten
// webApp.use('/api/game', authenticate, gameRoutes); // Beispiel für andere geschützte Routen

// 6. Socket.IO Middleware (Authentifizierung)
// --- ENTFERNT: Alte io.use Middleware für Session ID Check ---
io.use(async (socket, next) => { // <-- Integriert: Neue JWT Auth Middleware für Sockets
  try {
    const token = socket.handshake.auth.token; // Token aus Client 'auth' Objekt holen [15]
    if (!token) {
      console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Kein Token.`);
      return next(new Error('Nicht authentifiziert: Kein Token')); // Fehler an Client [15]
    }

    // Token verifizieren (Signatur & Ablaufdatum)
    const decoded = jwt.verify(token, authConfig.JWT_SECRET);

    // Spieler aus DB laden zur Validierung (Existenz, Aktivität)
    const player = await db.Player.findByPk(decoded.id, {
       attributes: ['id', 'username', 'role', 'is_active'] // Nur benötigte Felder laden
    });

    if (!player ||!player.is_active) {
       console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Ungültiger/inaktiver Spieler (ID: ${decoded.id}).`);
       return next(new Error('Nicht authentifiziert: Ungültiger Spieler'));
    }

    // Spielerdaten an das Socket-Objekt anhängen für spätere Verwendung
    socket.player = { id: player.id, username: player.username, role: player.role };
    console.log(`Socket Auth OK für ${socket.player.username} (${socket.id})`);
    next(); // Authentifizierung erfolgreich, Verbindung erlauben

  } catch (error) {
    // Fehler beim Verifizieren (ungültig, abgelaufen) oder DB-Fehler
    console.error(`Socket Auth Fehler (${socket.id}):`, error.message);
    // Spezifische Fehlermeldung für den Client ableiten
    const clientErrorMessage = (error.name === 'TokenExpiredError' |
| error.name === 'JsonWebTokenError')
                           ? 'Ungültiges oder abgelaufenes Token' // Spezifische JWT-Fehler [17]
                            : 'Authentifizierungsfehler';
    next(new Error(`Nicht authentifiziert: ${clientErrorMessage}`)); // Verbindung ablehnen, Fehler an Client [15]
  }
});

// 7. Socket.IO Verbindungsbehandlung & Event Listener
io.on('connection', (socket) => { // <-- Angepasst
  const playerInfo = socket.player; // Zugriff auf die durch io.use angehängten Daten

  if (!playerInfo) {
    console.error(`CRITICAL: socket.player nicht gesetzt für Socket ${socket.id}. Trenne Verbindung.`);
    socket.disconnect(true);
    return;
  }
  console.log(`Verbunden: ${playerInfo.username} (${socket.id})`);

  // Spieler einem Raum für gezielte Nachrichten hinzufügen
  socket.join(`player-${playerInfo.id}`);

  // Beitrittsnachricht an alle anderen senden
  socket.broadcast.emit('player-joined', { id: playerInfo.id, username: playerInfo.username });

  // Angepasste Event Listener
  socket.on('move', (pos) => { // <-- Angepasst
    if (!socket.player) return; // Schutzbedingung
    //... DB Update mit socket.player.id...
    //... Broadcast mit socket.player.id / username...
    console.log(`Move von ${socket.player.username}:`, pos);
    io.emit('player-moved', { id: socket.player.id, username: socket.player.username, position: pos }); // Beispiel Broadcast
  });

  socket.on('chat-message', (message) => { // <-- Angepasst
     if (!socket.player) return; // Schutzbedingung
     //... Broadcast der Nachricht mit senderId = socket.player.id, sender = socket.player.username...
     console.log(`Chat von ${socket.player.username}: ${message}`);
     io.emit('new-chat-message', { senderId: socket.player.id, sender: socket.player.username, text: message }); // Beispiel Broadcast
  });

  // Angepasster Disconnect Listener
  socket.on('disconnect', () => { // <-- Angepasst
    // Optional Chaining für Sicherheit, falls disconnect vor erfolgreicher Auth passiert
    const username = socket.player?.username |
| `Socket ${socket.id}`;
    console.log(`Getrennt: ${username}`);

    // Austrittsnachricht senden, falls Spielerdaten vorhanden waren
    if (socket.player) {
        socket.broadcast.emit('player-left', { id: socket.player.id });
    }
    // --- ENTFERNT: Alte Session Bereinigungslogik ---
  });
});

// 8. Starten des HTTP Servers
const PORT = process.env.PORT |
| 3001; // Beispiel Port
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
VII. Best Practices & Sicherheitsaspekte
Die Implementierung sollte folgende Best Practices und Sicherheitsüberlegungen berücksichtigen:

Reihenfolge der Middleware: Die korrekte Reihenfolge ist essentiell. cookieParser() muss vor allen Routen oder Middlewares ausgeführt werden, die req.cookies benötigen. Generell sollten globale Middlewares (CORS, Body Parser, Cookie Parser) vor den Routen-Definitionen stehen.   
Sichere Cookie-Einstellungen: Obwohl die Cookies in der Login-Route (Ticket 0006) gesetzt werden, ist es entscheidend, dass dies mit den Flags HttpOnly, Secure (nur über HTTPS senden, zwingend für Produktion) und SameSite=Strict (oder Lax) geschieht. Diese Flags sind der primäre Schutz gegen Cross-Site Scripting (XSS) und Cross-Site Request Forgery (CSRF) Angriffe auf Cookies. cookie-parser liest lediglich die Cookies, die der Browser gemäß dieser Flags sendet.   
Socket.io Authentifizierung: Die Verwendung von socket.handshake.auth.token zur Übermittlung des JWT vom Client ist die empfohlene Methode. Das Ablehnen von Verbindungen in der io.use-Middleware durch next(new Error(...)) ist der Standardweg, um unautorisierte Verbindungsversuche zu unterbinden und den Fehler an den Client zu propagieren.   
Serverseitige Zustandslosigkeit (Session-Daten): Durch den Wegfall der globalen Session-Variablen hält der Server keine Session-Daten mehr im Speicher vor. Dies verbessert die Skalierbarkeit und vereinfacht die Serverlogik. Es ist jedoch zu beachten, dass die WebSocket-Verbindung selbst zustandsbehaftet ist, nachdem sie authentifiziert wurde (siehe Abschnitt IV.B).   
CORS-Konfiguration: Cross-Origin Resource Sharing muss sowohl für die HTTP-API als auch für Socket.io korrekt konfiguriert werden, wenn Client und Server auf unterschiedlichen Origins (Domains oder Ports) laufen.
HTTP API (Express): Die cors()-Middleware muss für Express konfiguriert werden. Wenn Cookies über Domänen hinweg gesendet werden sollen (was bei JWT-in-Cookie-Strategien der Fall ist), muss die Konfiguration origin auf die spezifische(n) Frontend-URL(s) setzen und credentials: true enthalten.
Socket.io: Die cors-Option im new Server(...)-Konstruktor ist besonders wichtig. Wenn der Client withCredentials: true verwendet (notwendig für Cookie-Übertragung), muss die Serverkonfiguration credentials: true enthalten und origin darf nicht der Wildcard * sein, sondern muss die spezifische(n) erlaubte(n) Frontend-Origin(s) auflisten. Eine Fehlkonfiguration hier ist eine häufige Ursache für Verbindungsfehler, da Socket.io initial HTTP-Polling-Anfragen verwendet, die den CORS-Regeln unterliegen. Die Browser-Sicherheitsrichtlinien sind bei Anfragen mit Credentials (wie Cookies) deutlich strenger, um das Ausspähen von Benutzerdaten durch bösartige Websites zu verhindern. Der Server muss explizit signalisieren, dass er der spezifischen anfragenden Origin vertraut und Credentials akzeptiert.   
JWT-Sicherheit: Ein starker, zufälliger und geheimer JWT_SECRET ist fundamental für die Sicherheit der Signatur. Die Verwendung empfohlener Signaturalgorithmen (HS256 ist üblich, RS256 bietet Vorteile bei der Schlüsselverwaltung in komplexeren Systemen) ist wichtig. Die Validierung von Claims wie exp (Ablaufdatum) wird durch jwt.verify standardmäßig durchgeführt und ist entscheidend, um die Verwendung abgelaufener Tokens zu verhindern.   
VIII. Mögliche Probleme & Lösungsstrategien
Während der Implementierung können folgende Probleme auftreten:

Import-/Pfadfehler:
Problem: Der Server startet nicht oder meldet Fehler wie "Cannot find module", weil Pfade in require()-Anweisungen (z.B. require('./routes/authRoutes')) falsch sind.
Lösung: Überprüfen Sie alle Pfade sorgfältig relativ zur Position von server/index.js. Verwenden Sie console.log direkt nach dem require oder einen Debugger, um das erfolgreiche Laden der Module zu verifizieren.
Fehlerhafte Middleware-Reihenfolge:
Problem: req.cookies ist undefined in authRoutes oder der authenticate-Middleware, was zu Authentifizierungsfehlern führt, weil cookieParser() zu spät eingebunden wurde.
Lösung: Stellen Sie sicher, dass webApp.use(cookieParser()); vor allen Middlewares oder Routen steht, die auf req.cookies zugreifen. Konsultieren Sie die Express-Dokumentation zum Request-Lifecycle.
Socket.io Verbindungsfehler:
Problem: Clients können keine Socket.io-Verbindung herstellen. Das connect_error-Ereignis wird auf Client-Seite ausgelöst.
Lösung:
Server-Logs prüfen: Untersuchen Sie die Server-Konsolenausgabe auf Fehler innerhalb der io.use-Middleware (z.B. "Nicht authentifiziert", JWT-Verifizierungsfehler wie "invalid signature" oder "jwt expired", Datenbankfehler).
Client-Implementierung prüfen: Stellen Sie sicher, dass der Client das Token korrekt im auth-Objekt sendet (socket = io({ auth: { token: '...' } });), wie in Ticket 0009 vorgesehen.
Client-Fehler analysieren: Untersuchen Sie das Fehlerobjekt, das im connect_error-Handler auf Client-Seite empfangen wird. Die message-Eigenschaft enthält oft die vom Server gesendete Fehlermeldung.   
CORS-Konfiguration prüfen: Verifizieren Sie die cors-Einstellungen im new Server(...)-Konstruktor auf dem Server. Stimmen origin und credentials mit den Einstellungen und der URL des Clients überein?. Nutzen Sie die Entwicklertools des Browsers (Netzwerk-Tab), um die initialen /socket.io/...-HTTP-Anfragen und deren Antwort-Header (Access-Control-Allow-Origin, Access-Control-Allow-Credentials) zu inspizieren. Blockierte Anfragen deuten oft auf CORS-Probleme hin. Testen Sie die Erreichbarkeit des Servers auch mit curl.   
Inkonsistente Benutzerdaten:
Problem: Aktionen über Socket.io werden dem falschen Benutzer zugeordnet oder schlagen fehl, weil Benutzerdaten fehlen oder falsch sind.
Lösung: Stellen Sie sicher, dass alle Event-Handler (move, chat-message, etc.) konsistent das socket.player-Objekt zur Identifizierung des Benutzers verwenden (nach einer if (!socket.player)-Prüfung). Greifen Sie für Datenbankoperationen auf socket.player.id und für Anzeigezwecke oder Broadcasts auf socket.player.username oder socket.player.id zu. Vermeiden Sie jegliche Referenzen auf alte Session-Variablen.
Detaillierte CORS-Probleme:
Problem: Der Browser blockiert API-Anfragen (z.B. an /api/auth/login) oder die initialen Socket.io-Polling-Anfragen mit spezifischen CORS-Fehlermeldungen wie "Access-Control-Allow-Origin header missing" oder "Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'".   
Lösung:
HTTP API (Express): Konfigurieren Sie webApp.use(cors(corsOptions)) korrekt. Wenn Cookies benötigt werden, muss corsOptions zwingend origin: 'IHRE_FRONTEND_URL' (kein *) und credentials: true enthalten.
Socket.io: Konfigurieren Sie die cors-Option im new Server(...)-Konstruktor präzise. Setzen Sie origin auf die exakte(n) Frontend-URL(s) und credentials: true, falls der Client withCredentials: true sendet. Verwenden Sie niemals origin: '*' zusammen mit credentials: true.   
Debugging: Nutzen Sie die Entwicklertools des Browsers (Netzwerk-Tab), um die OPTIONS-Preflight-Anfrage (falls vorhanden) und die tatsächlichen Anfrage- und Antwort-Header zu untersuchen (Origin, Access-Control-Allow-Origin, Access-Control-Allow-Credentials). curl-Anfragen können helfen, das Serververhalten isoliert zu testen.   
JWT-Verifizierungsfehler:
Problem: Die io.use-Middleware schlägt spezifisch bei jwt.verify() fehl und lehnt Verbindungen mit Fehlern wie "Invalid token", "Token expired" oder "invalid signature" ab.
Lösung:
Secret Key Abgleich: Stellen Sie absolut sicher, dass der JWT_SECRET in authConfig exakt mit dem Secret übereinstimmt, das zum Signieren der Tokens verwendet wird (in der Login-Route von Ticket 0006). Abweichende Secrets sind die häufigste Ursache für "invalid signature"-Fehler.
Spezifische Fehler behandeln: Fangen Sie spezifische Fehler wie TokenExpiredError und JsonWebTokenError im catch-Block von io.use ab und geben Sie entsprechende Meldungen an den Client zurück (z.B. "Token abgelaufen", "Ungültiges Token").   
Token-Inhalt prüfen: Dekodieren Sie das Token lokal (z.B. auf jwt.io oder mit einem Skript), um den Inhalt und insbesondere den exp-Claim (Expiration Time) zu überprüfen, falls das Debugging schwierig ist.
IX. Verifizierung & Tests
Um sicherzustellen, dass die Integration erfolgreich war und die Akzeptanzkriterien des Tickets erfüllt sind, sollten folgende Schritte durchgeführt werden:

Serverstart: Überprüfen Sie, ob der Server nach Anwendung der Änderungen ohne Fehler im Zusammenhang mit Importen, Middleware-Registrierung oder Routen-Definition startet.
Entfernung alter Logik: Versuchen Sie, die alten API-Endpunkte (z.B. /api/login, falls nicht durch den Router abgefangen) direkt aufzurufen. Es sollte ein 404-Fehler oder eine ähnliche Fehlermeldung zurückgegeben werden, nicht der alte Handler. Überprüfen Sie, dass keine globalen Session-Variablen mehr im Code existieren.
Funktionstest neue Auth-API: Testen Sie die neuen Endpunkte unter /api/auth (/register, /login, /logout, /me o.ä.). Stellen Sie sicher, dass der Login-Vorgang das JWT-Cookie korrekt im Browser setzt (überprüfen mit Entwicklertools).
Socket.io Verbindung (Authentifiziert): Stellen Sie nach einem erfolgreichen Login (und Erhalt des JWT) eine Socket.io-Verbindung vom Client her. Senden Sie dabei das Token im auth-Objekt (io({ auth: { token:... } })). Überprüfen Sie die Server-Logs auf eine erfolgreiche Authentifizierung durch die io.use-Middleware.
Socket.io Verbindung (Unauthentifiziert/Ungültig): Versuchen Sie, eine Verbindung ohne Token, mit einem manipulierten (ungültigen) Token oder einem abgelaufenen Token herzustellen. Überprüfen Sie, ob die Verbindung serverseitig abgelehnt wird und der Client ein connect_error-Ereignis mit einer aussagekräftigen Fehlermeldung empfängt.   
Test authentifizierter Socket-Events: Führen Sie nach erfolgreicher Verbindung Aktionen aus, die authentifizierte Socket-Events nutzen:
Senden Sie ein move-Ereignis. Überprüfen Sie, ob der Server den korrekten Benutzernamen loggt und die Bewegung korrekt an andere Clients weiterleitet.
Senden Sie eine chat-message. Überprüfen Sie, ob der Server den korrekten Absender loggt und die Nachricht mit den korrekten Absenderinformationen weiterleitet.
Verbindungstrennung: Trennen Sie die Client-Verbindung. Überprüfen Sie die Server-Logs auf die korrekte Meldung mit dem Benutzernamen. Stellen Sie sicher, dass eventuelle player-left-Ereignisse korrekt gesendet werden und keine Fehler im Zusammenhang mit alter Session-Bereinigung auftreten.
Code-Review: Führen Sie eine Überprüfung des geänderten Codes durch. Achten Sie besonders auf die vollständige Entfernung alter Logik, die korrekte Platzierung der neuen Komponenten, die konsistente Verwendung von socket.player und die Einhaltung von Fehlerbehandlungs- und Sicherheitsrichtlinien.
X. Fazit
Die erfolgreiche Implementierung von Ticket 0007 markiert den Übergang des Kernauthentifizierungssystems des PokeTogetherBrowser-Servers von einem veralteten, speicherbasierten Session-Ansatz zu einem modernen, standardkonformen JWT/Cookie-System. Durch die Integration von cookie-parser und den neuen Authentifizierungsrouten, die konsequente Entfernung aller alten Session-Artefakte sowie die Implementierung einer robusten JWT-Validierung für Socket.io-Verbindungen mittels io.use und die Anpassung der Event-Handler an socket.player, wird eine sicherere, skalierbarere und wartbarere Basis geschaffen.

Diese Umstellung behebt eine wesentliche Diskrepanz zwischen Dokumentation und Code und legt das Fundament für die sichere Implementierung zukünftiger Kernfeatures des Spiels, die auf einer zuverlässigen Identifizierung und Authentifizierung der Spieler aufbauen. Mit Abschluss dieses Tickets ist der Server bereit für die Entwicklung weiterer Funktionalitäten, die nun auf einem konsistenten und sichereren Authentifizierungsmechanismus aufsetzen können.