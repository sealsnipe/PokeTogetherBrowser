const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Socket.IO Server Klasse
const path = require('path');
const cookieParser = require('cookie-parser'); // Zum Parsen von Cookie-Headern
const cors = require('cors'); // Für Cross-Origin Resource Sharing
const jwt = require('jsonwebtoken'); // Zur Verifizierung von JWTs in der Socket.io Middleware
const db = require('./models'); // Sequelize Instanz und Modelle
const authConfig = require('./config/auth'); // Enthält JWT_SECRET (Pfad ggf. anpassen)
const authRoutes = require('./routes/authRoutes'); // Der Router für /api/auth Endpunkte (Pfad ggf. anpassen)
const { initDatabase } = require('./db/init');

// Server-Ports
const SOCKET_PORT = 3001;
const WEB_PORT = 3000;

// Express-App für Socket.io
const socketApp = express();
const httpServer = http.createServer(socketApp);
// 3. Initialisierung des Socket.IO Servers & CORS Konfiguration
const io = new Server(httpServer, {
  cors: {
    // WICHTIG: 'origin' an die Frontend-URL anpassen!
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Beispiel für Entwicklung
    methods: ["GET", "POST"],
    // Erforderlich, wenn der Client Cookies mitsendet (z.B. für Socket-Auth-Token aus HttpOnly-Cookie)
    // oder wenn der Client 'withCredentials: true' verwendet.
    credentials: true,
  }
});

// Express-App für Webserver
const webApp = express();


// 4. Globale Express Middleware
// CORS für HTTP API (ggf. spezifischer konfigurieren als Socket.IO CORS)
webApp.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true // Erforderlich für Cookie-basierte API-Authentifizierung
}));
webApp.use(express.json()); // Für JSON Request Bodies
webApp.use(express.urlencoded({ extended: true })); // Für URL-encoded Request Bodies
webApp.use(cookieParser()); // <-- Integriert: MUSS vor Routen stehen, die Cookies benötigen

// Statische Dateien aus dem Client-Verzeichnis servieren
const clientPath = path.join(__dirname, '..', 'client');
webApp.use(express.static(clientPath));

// --- ENTFERNT: Alte globale Session-Variablen (sessions, sessionToSocket, etc.) ---
// --- ENTFERNT: Alte generateSessionId Funktion ---
// Spielerdaten werden jetzt direkt im Socket-Objekt verwaltet (socket.player)
// und bei Bedarf aus der DB geladen.

// 6. Socket.IO Middleware (Authentifizierung)
// --- ENTFERNT: Alte io.use Middleware für Session ID Check ---
io.use(async (socket, next) => { // <-- Integriert: Neue JWT Auth Middleware für Sockets
  try {
    const token = socket.handshake.auth.token; // Token aus Client 'auth' Objekt holen
    if (!token) {
      console.warn(`Socket Auth fehlgeschlagen (${socket.id}): Kein Token.`);
      return next(new Error('Nicht authentifiziert: Kein Token')); // Fehler an Client
    }

    // Token verifizieren (Signatur & Ablaufdatum)
    const decoded = jwt.verify(token, authConfig.JWT_SECRET);

    // Spieler aus DB laden zur Validierung (Existenz, Aktivität)
    const player = await db.Player.findByPk(decoded.id, {
       attributes: ['id', 'username', 'role', 'is_active'] // Nur benötigte Felder laden
    });

    if (!player || !player.is_active) {
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
    const clientErrorMessage = (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError')
                           ? 'Ungültiges oder abgelaufenes Token' // Spezifische JWT-Fehler
                            : 'Authentifizierungsfehler';
    next(new Error(`Nicht authentifiziert: ${clientErrorMessage}`)); // Verbindung ablehnen, Fehler an Client
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

  // Lade aktuelle Spielerdaten (Positionen etc.) und sende sie an den neuen Spieler
  // (Ersetzt das alte 'players'-Objekt)
  // TODO: Implementiere Logik zum Sammeln aktueller Spielerdaten für 'init'
  const currentPlayersData = {}; // Platzhalter
  // Beispiel: Iteriere über verbundene Sockets und sammle deren playerInfo und Position
  io.sockets.sockets.forEach(connectedSocket => {
      if (connectedSocket.player && connectedSocket.id !== socket.id) { // Schließe den neuen Spieler selbst aus
          // TODO: Hole die aktuelle Position des connectedSocket.player (z.B. aus DB oder einem Cache)
          currentPlayersData[connectedSocket.id] = {
              username: connectedSocket.player.username,
              id: connectedSocket.player.id,
              // position: { x: ..., y: ..., isRunning: ... } // Beispielposition
          };
      }
  });
  // Füge den neuen Spieler selbst hinzu (mit seiner Startposition aus der DB)
  db.Player.findByPk(playerInfo.id).then(player => {
      if (player) {
          currentPlayersData[socket.id] = {
              username: player.username,
              id: player.id,
              position: {
                  x: player.position_x || 20,
                  y: player.position_y || 20,
                  isRunning: player.is_running || false
              }
          };
          socket.emit('init', currentPlayersData); // Sende Init-Daten an den neuen Spieler
      }
  }).catch(err => console.error("Fehler beim Laden der Startposition für init:", err));


  // Beitrittsnachricht an alle anderen senden
  socket.broadcast.emit('player-joined', { id: playerInfo.id, username: playerInfo.username });

  // Angepasste Event Listener
  socket.on('move', (pos) => { // <-- Angepasst
    if (!socket.player) { console.warn(`Move Event von nicht authentifiziertem Socket ${socket.id}`); return; } // Schutzbedingung

    // Aktualisiere die Position in der Datenbank
    db.Player.update(
        { position_x: pos.x, position_y: pos.y, is_running: pos.isRunning || false },
        { where: { id: socket.player.id } }
    ).catch(err => {
      console.error(`Fehler beim Speichern der Position für ${socket.player.username}:`, err);
    });

    // Sende die aktualisierte Position an alle anderen Spieler
    socket.broadcast.emit('player-moved', {
      id: socket.player.id,
      username: socket.player.username, // Sende auch den Namen mit
      position: pos // Sende das komplette Positions-Objekt
    });
    // console.log(`Move von ${socket.player.username}:`, pos); // Optionales Logging
  });

  socket.on('chat-message', (message) => { // <-- Angepasst
     if (!socket.player) { console.warn(`Chat Event von nicht authentifiziertem Socket ${socket.id}`); return; } // Schutzbedingung
     const timestamp = new Date().toISOString();
     const chatMessage = {
         senderId: socket.player.id,
         sender: socket.player.username,
         text: message,
         timestamp: timestamp
     };
     io.emit('new-chat-message', chatMessage); // Sende an alle, inkl. Absender
     console.log(`Chat von ${socket.player.username}: ${message}`);
  });

  // Angepasster Disconnect Listener
  socket.on('disconnect', () => { // <-- Angepasst
    // Optional Chaining für Sicherheit, falls disconnect vor erfolgreicher Auth passiert
    const username = socket.player?.username || `Socket ${socket.id}`;
    console.log(`Getrennt: ${username}`);

    // Austrittsnachricht senden, falls Spielerdaten vorhanden waren
    if (socket.player) {
        socket.broadcast.emit('player-left', { id: socket.player.id });
    }
    // --- ENTFERNT: Alte Session Bereinigungslogik ---

    // Informiere alle Spieler über den Abgang
    io.emit('player-left', socket.id);
    console.log(`Verbindung getrennt: ${username} (${socket.id})`);
  });
});

// 5. API Routen Definition
// --- ENTFERNT: Alte Routen-Handler für /api/login, /api/logout, /api/check-session ---
webApp.use('/api/auth', authRoutes); // <-- Integriert: Neue Authentifizierungsrouten
// webApp.use('/api/game', authenticate, gameRoutes); // Beispiel für andere geschützte Routen

// Initialisiere die Datenbank
initDatabase().then(() => {
  // Starte den Socket.io-Server
  httpServer.listen(SOCKET_PORT, () => console.log(`Socket.io-Server läuft auf Port ${SOCKET_PORT}`));

  // Starte den Webserver
  webApp.listen(WEB_PORT, () => console.log(`Webserver läuft auf Port ${WEB_PORT}`));

  console.log(`Client-Dateien werden aus ${clientPath} serviert`);
  console.log(`Öffne http://localhost:${WEB_PORT} im Browser, um das Spiel zu starten`);
}).catch(err => {
  console.error('Fehler beim Initialisieren der Datenbank:', err);
});
