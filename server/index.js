const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const db = require('./models');
const { initDatabase } = require('./db/init');

// Server-Ports
const SOCKET_PORT = 3001;
const WEB_PORT = 3000;

// Express-App für Socket.io
const socketApp = express();
const httpServer = http.createServer(socketApp);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Express-App für Webserver
const webApp = express();


// Cookie-Parser Middleware (wichtig für JWT-Cookie Handling)
webApp.use(cookieParser());

// Middleware für JSON-Parsing
webApp.use(express.json());

// Statische Dateien aus dem Client-Verzeichnis servieren
const clientPath = path.join(__dirname, '..', 'client');
webApp.use(express.static(clientPath));

// Aktive Sitzungen speichern
const sessions = {};

// Funktion zum Generieren einer zufälligen Session-ID
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

// Spieler-Daten (socketId -> Spielerinformationen)
const players = {};

// Zuordnung von Session-IDs zu Socket-IDs
const sessionToSocket = {};
const socketToSession = {};

// Socket.io-Middleware für Authentifizierung
io.use((socket, next) => {
  const sessionId = socket.handshake.auth.sessionId;

  if (!sessionId || !sessions[sessionId]) {
    return next(new Error('Nicht authentifiziert'));
  }

  // Speichere die Zuordnung zwischen Session und Socket
  const username = sessions[sessionId].username;
  sessionToSocket[sessionId] = socket.id;
  socketToSession[socket.id] = { sessionId, username };

  console.log(`Authentifizierte Verbindung für ${username} (${socket.id})`);
  next();
});

io.on('connection', (socket) => {
  const { sessionId, username } = socketToSession[socket.id];
  console.log(`Verbunden: ${username} (${socket.id})`);

  // Lade Spielerdaten aus der Datenbank
  db.Player.findOne({
    where: { username: username }
  }).then(player => {
    if (player) {
      // Feste Startposition für neue Spieler (oben links in einer freien Ecke)
      players[socket.id] = {
        x: player.position_x || 20,
        y: player.position_y || 20,
        username: username, // Speichere den Benutzernamen mit der Position
        isRunning: player.is_running || false
      };

      // Sende alle aktuellen Spieler an den neuen Spieler
      socket.emit('init', players);

      // Informiere alle anderen Spieler über den neuen Spieler
      socket.broadcast.emit('player-joined', {
        id: socket.id,
        pos: players[socket.id],
        username: username
      });
    }
  }).catch(err => {
    console.error('Fehler beim Laden der Spielerdaten:', err);
  });

  // Bewegungs-Handler
  socket.on('move', (pos) => {
    // Aktualisiere die Position, behalte aber den Benutzernamen bei
    players[socket.id] = { ...pos, username: username };

    // Aktualisiere die Position in der Datenbank
    db.Player.findOne({
      where: { username: username }
    }).then(player => {
      if (player) {
        player.position_x = pos.x;
        player.position_y = pos.y;
        player.is_running = pos.isRunning || false;
        return player.save();
      }
    }).catch(err => {
      console.error('Fehler beim Speichern der Position:', err);
    });

    // Sende die aktualisierte Position an alle anderen Spieler
    socket.broadcast.emit('player-moved', {
      id: socket.id,
      pos: players[socket.id],
      username: username
    });
  });

  // Chat-Nachrichten-Handler
  socket.on('chat-message', (message) => {
    const timestamp = new Date().toISOString();
    const chatMessage = {
      sender: username,
      senderId: socket.id,
      text: message,
      timestamp: timestamp
    };

    // Sende die Nachricht an alle Spieler (einschließlich des Absenders)
    io.emit('chat-message', chatMessage);

    console.log(`Chat-Nachricht von ${username}: ${message}`);
  });

  // Verbindungsabbruch-Handler
  socket.on('disconnect', () => {
    // Lösche den Spieler aus der Liste
    delete players[socket.id];

    // Lösche die Socket-zu-Session-Zuordnung
    if (socketToSession[socket.id]) {
      const sessionId = socketToSession[socket.id].sessionId;
      delete sessionToSocket[sessionId];
      delete socketToSession[socket.id];
    }

    // Informiere alle Spieler über den Abgang
    io.emit('player-left', socket.id);
    console.log(`Verbindung getrennt: ${username} (${socket.id})`);
  });
});

// Login-API
webApp.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Suche den Benutzer in der Datenbank
    const player = await db.Player.findOne({
      where: { username: username }
    });

    if (!player) {
      return res.status(401).json({ success: false, message: 'Ungültiger Benutzername oder Passwort' });
    }

    // Überprüfe das Passwort mit bcrypt
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, player.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Ungültiger Benutzername oder Passwort' });
    }

    // Generiere eine neue Session-ID
    const sessionId = generateSessionId();

    // Speichere die Session
    sessions[sessionId] = { username, timestamp: Date.now() };

    // Aktualisiere den letzten Login-Zeitpunkt
    player.last_login = new Date();
    await player.save();

    console.log(`Benutzer ${username} hat sich angemeldet`);

    // Sende die Session-ID zurück
    res.json({ success: true, sessionId, username });
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ success: false, message: 'Serverfehler beim Login' });
  }
});

// Logout-API
webApp.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;

  if (sessions[sessionId]) {
    const username = sessions[sessionId].username;
    const socketId = sessionToSocket[sessionId];

    // Lösche die Session
    delete sessions[sessionId];

    // Trenne die Socket.IO-Verbindung
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      delete sessionToSocket[sessionId];
      delete socketToSession[socketId];
    }

    console.log(`Benutzer ${username} hat sich abgemeldet`);

    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Ungültige Session' });
  }
});

// Session-Überprüfungs-API
webApp.post('/api/check-session', (req, res) => {
  const { sessionId } = req.body;

  if (sessions[sessionId]) {
    // Aktualisiere den Zeitstempel
    sessions[sessionId].timestamp = Date.now();
    res.json({ success: true, username: sessions[sessionId].username });
  } else {
    res.status(401).json({ success: false, message: 'Ungültige oder abgelaufene Session' });
  }
});

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
