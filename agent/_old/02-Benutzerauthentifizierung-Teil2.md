# Benutzerauthentifizierung für PokeTogetherBrowser - Teil 2

## Authentifizierungs-Middleware

Wir erstellen eine Middleware zur Überprüfung der Authentifizierung:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models');

// JWT-Secret aus Umgebungsvariablen oder Fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware zur Überprüfung der Authentifizierung
exports.authenticate = async (req, res, next) => {
  try {
    // Token aus Cookie oder Authorization-Header extrahieren
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Benutzer in der Datenbank suchen
    const player = await db.Player.findByPk(decoded.id);
    
    if (!player || !player.is_active) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // Benutzerinformationen an Request-Objekt anhängen
    req.player = {
      id: player.id,
      username: player.username,
      role: player.role
    };

    next();
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token abgelaufen' });
    }
    
    res.status(401).json({ message: 'Nicht authentifiziert' });
  }
};

// Middleware zur Überprüfung der Berechtigungen
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.player) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (roles.length && !roles.includes(req.player.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    next();
  };
};
```

## Validierungsschema

Wir erstellen Validierungsschemata für die Registrierung und das Login:

```javascript
// validators/authValidators.js
const { body } = require('express-validator');

exports.registerValidator = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Benutzername muss zwischen 3 und 50 Zeichen lang sein')
    .isAlphanumeric()
    .withMessage('Benutzername darf nur Buchstaben und Zahlen enthalten')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Ungültige E-Mail-Adresse')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Passwort muss mindestens 6 Zeichen lang sein')
    .matches(/\d/)
    .withMessage('Passwort muss mindestens eine Zahl enthalten'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwörter stimmen nicht überein');
      }
      return true;
    })
];

exports.loginValidator = [
  body('username')
    .notEmpty()
    .withMessage('Benutzername ist erforderlich')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Passwort ist erforderlich')
];
```

## Authentifizierungs-Routen

Wir erstellen Routen für die Authentifizierung:

```javascript
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const { authenticate } = require('../middleware/auth');

// Registrierung
router.post('/register', registerValidator, authController.register);

// Login
router.post('/login', loginValidator, authController.login);

// Logout
router.post('/logout', authenticate, authController.logout);

// Aktuellen Benutzer abrufen
router.get('/me', authenticate, (req, res) => {
  res.json({ player: req.player });
});

module.exports = router;
```

## Socket.io-Authentifizierung

Wir implementieren die Authentifizierung für Socket.io-Verbindungen:

```javascript
// middleware/socketAuth.js
const jwt = require('jsonwebtoken');
const db = require('../models');

// JWT-Secret aus Umgebungsvariablen oder Fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Socket.io-Authentifizierungs-Middleware
module.exports = async (socket, next) => {
  try {
    // Token aus Handshake-Daten extrahieren
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Nicht authentifiziert'));
    }

    // Token verifizieren
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Benutzer in der Datenbank suchen
    const player = await db.Player.findByPk(decoded.id);
    
    if (!player || !player.is_active) {
      return next(new Error('Nicht authentifiziert'));
    }

    // Benutzerinformationen an Socket-Objekt anhängen
    socket.player = {
      id: player.id,
      username: player.username,
      role: player.role
    };

    next();
  } catch (error) {
    console.error('Socket-Authentifizierungsfehler:', error);
    next(new Error('Nicht authentifiziert'));
  }
};
```

## Integration in den Server

Wir integrieren die Authentifizierung in den Server:

```javascript
// server/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./db/init');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const socketAuth = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, '../client')));

// API-Routen
app.use('/api/auth', authRoutes);

// Datenbank initialisieren
initDatabase();

// Socket.io-Authentifizierung
io.use(socketAuth);

// Socket.io-Verbindungen
io.on('connection', (socket) => {
  console.log(`Spieler ${socket.player.username} verbunden`);
  
  // Spielerdaten laden und senden
  loadPlayerData(socket);
  
  // Anderen Spielern mitteilen, dass ein neuer Spieler verbunden ist
  socket.broadcast.emit('player joined', {
    id: socket.player.id,
    username: socket.player.username,
    position: socket.player.position
  });
  
  // Bewegungs-Handler
  socket.on('move', async (data) => {
    try {
      // Position in der Datenbank aktualisieren
      const player = await db.Player.findByPk(socket.player.id);
      if (player) {
        player.position_x = data.x;
        player.position_y = data.y;
        await player.save();
      }
      
      // Anderen Spielern die neue Position mitteilen
      socket.broadcast.emit('player moved', {
        id: socket.player.id,
        username: socket.player.username,
        position: {
          x: data.x,
          y: data.y
        }
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Position:', error);
    }
  });
  
  // Chat-Nachricht
  socket.on('chat message', (message) => {
    io.emit('chat message', {
      username: socket.player.username,
      message: message
    });
  });
  
  // Trennung
  socket.on('disconnect', () => {
    // Anderen Spielern mitteilen, dass ein Spieler getrennt wurde
    socket.broadcast.emit('player left', {
      id: socket.player.id,
      username: socket.player.username
    });
    
    console.log(`Spieler ${socket.player.username} getrennt`);
  });
});

// Hilfsfunktion zum Laden der Spielerdaten
async function loadPlayerData(socket) {
  try {
    const playerId = socket.player.id;
    
    // Spieler aus der Datenbank laden
    const player = await db.Player.findByPk(playerId);
    
    // Inventar laden
    const inventory = await db.InventoryItem.findAll({
      where: { PlayerId: playerId },
      include: [db.Item]
    });
    
    // Pokémon laden
    const pokemon = await db.PlayerPokemon.findAll({
      where: { PlayerId: playerId },
      include: [db.PokemonBase],
      order: [['team_position', 'ASC']]
    });
    
    // Spielerdaten an den Client senden
    socket.emit('player data', {
      id: player.id,
      username: player.username,
      position: {
        x: player.position_x,
        y: player.position_y
      },
      inventory: inventory.map(item => ({
        id: item.Item.id,
        name: item.Item.name,
        type: item.Item.type,
        quantity: item.quantity,
        icon: item.Item.icon
      })),
      pokemon: pokemon.map(p => ({
        id: p.id,
        name: p.PokemonBase.name,
        nickname: p.nickname,
        level: p.level,
        type: p.PokemonBase.secondary_type 
          ? `${p.PokemonBase.primary_type}/${p.PokemonBase.secondary_type}`
          : p.PokemonBase.primary_type,
        hp: p.current_hp,
        maxHp: p.max_hp,
        isInTeam: p.is_in_team,
        teamPosition: p.team_position
      }))
    });
    
    // Andere verbundene Spieler laden
    const connectedSockets = await io.fetchSockets();
    const connectedPlayers = connectedSockets
      .filter(s => s.id !== socket.id && s.player)
      .map(s => ({
        id: s.player.id,
        username: s.player.username,
        position: s.player.position
      }));
    
    // Verbundene Spieler an den Client senden
    socket.emit('connected players', connectedPlayers);
  } catch (error) {
    console.error('Fehler beim Laden der Spielerdaten:', error);
    socket.emit('error', { message: 'Fehler beim Laden der Spielerdaten' });
  }
}

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
```
