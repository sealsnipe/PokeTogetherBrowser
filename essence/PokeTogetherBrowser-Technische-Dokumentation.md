# PokeTogetherBrowser - Technische Dokumentation

## Systemarchitektur

### Technologie-Stack

- **Backend**:
  - Node.js als Laufzeitumgebung
  - Express.js als Web-Framework
  - Socket.io für Echtzeit-Kommunikation
  - Sequelize als ORM
  - SQLite als Datenbank
  - bcrypt für Passwort-Hashing

- **Frontend**:
  - HTML5, CSS3 und JavaScript
  - Next.js für Komponenten-Rendering
  - Socket.io-Client für Echtzeit-Kommunikation

### Verzeichnisstruktur

```
PokeTogetherBrowser/
├── client/                 # Frontend-Code
│   ├── .next/              # Next.js Build-Dateien
│   ├── components/         # React-Komponenten
│   ├── pages/              # Next.js Seiten
│   ├── styles/             # CSS-Dateien
│   ├── public/             # Statische Dateien
│   └── package.json        # Frontend-Abhängigkeiten
├── server/                 # Backend-Code
│   ├── controllers/        # API-Controller
│   ├── db/                 # Datenbank-Konfiguration und Seed-Daten
│   ├── middleware/         # Express-Middleware
│   ├── models/             # Sequelize-Modelle
│   ├── routes/             # API-Routen
│   └── index.js            # Server-Einstiegspunkt
├── agent/                  # Dokumentation
├── essence/                # Projektberichte
├── package.json            # Backend-Abhängigkeiten
├── start.bat               # Startskript für Windows
└── start_game.bat          # Erweitertes Startskript
```

## Datenmodell

### Entitäten und Beziehungen

#### Player (Spieler)
- Primärschlüssel: `id`
- Attribute: `username`, `password_hash`, `position_x`, `position_y`, `is_running`, `money`, `play_time`, `last_save`, `last_login`
- Beziehungen:
  - 1:n mit `InventoryItem`
  - 1:n mit `PlayerPokemon`

#### Item (Gegenstand)
- Primärschlüssel: `id`
- Attribute: `name`, `type`, `description`, `icon`, `usable`, `effect`
- Beziehungen:
  - 1:n mit `InventoryItem`
  - 1:n mit `PlayerPokemon` (als Halte-Item)

#### InventoryItem (Inventargegenstand)
- Primärschlüssel: `id`
- Attribute: `quantity`
- Beziehungen:
  - n:1 mit `Player`
  - n:1 mit `Item`

#### PokemonBase (Pokémon-Grunddaten)
- Primärschlüssel: `id`
- Attribute: `name`, `primary_type`, `secondary_type`, `base_hp`, `base_attack`, `base_defense`, `base_speed`
- Beziehungen:
  - 1:n mit `PlayerPokemon`
  - 1:n mit sich selbst (Evolutionen)

#### PlayerPokemon (Spieler-Pokémon)
- Primärschlüssel: `id`
- Attribute: `nickname`, `level`, `current_hp`, `max_hp`, `experience`, `is_in_team`, `team_position`, `caught_at`, `caught_location`
- Beziehungen:
  - n:1 mit `Player`
  - n:1 mit `PokemonBase`
  - n:m mit `Move` (durch `PokemonMove`)
  - n:1 mit `Item` (als Halte-Item)

#### Move (Attacke)
- Primärschlüssel: `id`
- Attribute: `name`, `type`, `power`, `accuracy`, `pp`
- Beziehungen:
  - n:m mit `PlayerPokemon` (durch `PokemonMove`)

#### PokemonMove (Pokémon-Attacke)
- Verbindungstabelle zwischen `PlayerPokemon` und `Move`
- Attribute: `pp_current`, `pp_max`

#### Battle (Kampf)
- Primärschlüssel: `id`
- Attribute: `type`, `status`, `current_turn`, `player1_active_pokemon`, `player2_active_pokemon`, `battle_data`, `started_at`, `ended_at`
- Beziehungen:
  - n:1 mit `Player` (als player1_id)
  - n:1 mit `Player` (als player2_id)

## Server-Komponenten

### Express-Server

Der Express-Server stellt die Webseiten und API-Endpunkte bereit:

```javascript
// Express-App für Webserver
const webApp = express();

// Middleware für JSON-Parsing
webApp.use(express.json());

// Statische Dateien aus dem Client-Verzeichnis servieren
const clientPath = path.join(__dirname, '..', 'client');
webApp.use(express.static(clientPath));

// Starte den Webserver
webApp.listen(WEB_PORT, () => console.log(`Webserver läuft auf Port ${WEB_PORT}`));
```

### Socket.io-Server

Der Socket.io-Server verwaltet die Echtzeit-Kommunikation:

```javascript
// Express-App für Socket.io
const socketApp = express();
const httpServer = http.createServer(socketApp);
const io = new Server(httpServer, { cors: { origin: '*' } });

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

// Starte den Socket.io-Server
httpServer.listen(SOCKET_PORT, () => console.log(`Socket.io-Server läuft auf Port ${SOCKET_PORT}`));
```

### Datenbank-Initialisierung

Die Datenbank wird beim Serverstart initialisiert:

```javascript
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
```

## Client-Komponenten

### Spielkomponente

Die Hauptspielkomponente verwaltet das Spielfeld und die Spielerinteraktionen:

```javascript
export default function Game() {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState({});
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    socket.on('init', (serverPlayers) => {
      setPlayers(serverPlayers);
      setMyId(socket.id);
    });
    socket.on('player-joined', ({ id, pos }) => {
      setPlayers(prev => ({ ...prev, [id]: pos }));
    });
    socket.on('player-moved', ({ id, pos }) => {
      setPlayers(prev => ({ ...prev, [id]: pos }));
    });
    socket.on('player-left', (id) => {
      setPlayers(prev => {
        const cp = { ...prev };
        delete cp[id];
        return cp;
      });
    });
    return () => socket.disconnect();
  }, []);

  // Bewegungssteuerung und Rendering-Logik
  // ...
}
```

### Bewegungsmechanik

Die Bewegungsmechanik verwendet Tastatureingaben und sendet Updates an den Server:

```javascript
function updatePlayerPosition(deltaTime) {
  if (!myId || !players[myId]) return;

  // Hole die aktuelle Canvas-Größe
  const canvasWidth = gameCanvas.width;
  const canvasHeight = gameCanvas.height;

  // Skalierungsfaktor für Bewegung basierend auf der Standardgröße (500x500)
  const scaleX = canvasWidth / 500;
  const scaleY = canvasHeight / 500;

  // Aktuelle Position
  const pos = { ...(players[myId]) };

  // Berechne die Geschwindigkeit basierend auf dem Renn-Status
  const speed = isRunning ? runningSpeed : baseSpeed;

  // Berechne die Bewegung basierend auf der verstrichenen Zeit (für gleichmäßige Bewegung)
  const moveStep = speed * (deltaTime / 16); // Normalisiere auf ~60 FPS

  // Aktualisiere die Position basierend auf den gedrückten Tasten
  if (keys.up) pos.y -= moveStep;
  if (keys.down) pos.y += moveStep;
  if (keys.left) pos.x -= moveStep;
  if (keys.right) pos.x += moveStep;

  // Begrenze die Position auf den Spielbereich
  const playerSize = 20 * Math.min(scaleX, scaleY);
  pos.x = Math.max(0, Math.min(pos.x, canvasWidth - playerSize));
  pos.y = Math.max(0, Math.min(pos.y, canvasHeight - playerSize));

  // Aktualisiere die lokale Spielerposition
  players[myId] = { ...pos, username };

  // Sende die Position an den Server (mit Ratenbegrenzung)
  const now = Date.now();
  if (now - lastNetworkUpdate >= networkUpdateInterval) {
    lastNetworkUpdate = now;
    socket.emit('move', pos);
  }
}
```

## Spielmechaniken

### Authentifizierung

Die Authentifizierung verwendet Sessions und bcrypt für die Passwortsicherheit:

```javascript
// Login-Funktion
exports.login = async (req, res) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Benutzer suchen
    const player = await db.Player.findOne({
      where: { username }
    });

    // Benutzer nicht gefunden oder inaktiv
    if (!player || !player.is_active) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isPasswordValid = await player.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Session erstellen und Token generieren
    // ...
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
};
```

### Pokémon-Team-Verwaltung

Die Team-Verwaltung ermöglicht das Verschieben von Pokémon zwischen Team und Lager:

```javascript
// Hilfsfunktion: Pokémon ins Team verschieben
async function movePokemonToTeam(playerId, pokemonId, position) {
  // Anzahl der Pokémon im Team zählen
  const teamCount = await db.PlayerPokemon.count({
    where: {
      PlayerId: playerId,
      is_in_team: true
    }
  });

  // Prüfen, ob das Team bereits voll ist (max. 10 Pokémon)
  if (teamCount >= 10) {
    throw new Error('Das Team ist bereits voll (max. 10 Pokémon)');
  }

  // Pokémon in der Datenbank suchen
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: pokemonId,
      PlayerId: playerId,
      is_in_team: false
    }
  });

  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden oder bereits im Team');
  }

  // Wenn keine Position angegeben wurde, ans Ende des Teams setzen
  if (position === undefined) {
    position = teamCount;
  }

  // Transaktion starten
  const transaction = await db.sequelize.transaction();

  try {
    // Pokémon ins Team verschieben
    pokemon.is_in_team = true;
    pokemon.team_position = position;
    await pokemon.save({ transaction });

    // Andere Pokémon im Team verschieben, falls nötig
    // ...

    // Transaktion bestätigen
    await transaction.commit();
  } catch (error) {
    // Transaktion zurückrollen bei Fehler
    await transaction.rollback();
    throw error;
  }
}
```

### Kampfsystem

Das Kampfsystem implementiert die Pokémon-Kampfmechanik:

```javascript
// Hilfsfunktion: Angriff ausführen
async function performAttack(battle, playerId, moveId, targetPosition) {
  // Bestimmen, ob der Spieler Spieler 1 oder Spieler 2 ist
  const isPlayer1 = battle.player1_id === playerId;
  
  // Aktives Pokémon des Angreifers laden
  const attackerPokemonId = isPlayer1 ? battle.player1_active_pokemon : battle.player2_active_pokemon;
  let attackerPokemon;

  // Angriff durchführen
  // ...
  
  // Schaden berechnen
  const damage = calculateDamage(move, attackerPokemon, defenderPokemon);
  
  // Schaden anwenden
  defenderPokemon.current_hp = Math.max(0, defenderPokemon.current_hp - damage);
  await defenderPokemon.save();
  
  // Ergebnis vorbereiten
  const result = {
    message: `${attackerPokemon.nickname || attackerPokemon.PokemonBase.name} setzt ${move.name} ein!`,
    damage: damage,
    effectiveness: effectiveness,
    critical: isCritical,
    defenderHp: defenderPokemon.current_hp,
    defenderMaxHp: defenderPokemon.max_hp,
    nextTurn: false,
    battleEnded: false,
    needsSwitch: false
  };
  
  // Prüfen, ob das Verteidiger-Pokémon besiegt wurde
  if (defenderPokemon.current_hp === 0) {
    result.message += ` ${defenderPokemon.nickname || defenderPokemon.PokemonBase.name} wurde besiegt!`;
    
    // Prüfen, ob der Kampf beendet ist
    // ...
  }
  
  return result;
}
```

### Typ-Effektivität

Die Typ-Effektivität wird gemäß dem Pokémon-Typsystem berechnet:

```javascript
// Funktion zur Berechnung der Typ-Effektivität
function calculateTypeEffectiveness(attackType, defenderType) {
  // Standardeffektivität
  let effectiveness = 1;
  
  // Englische Typnamen verwenden (für die Tabelle)
  const attackTypeEn = translateTypeToEnglish(attackType);
  
  // Verteidigertypen aufteilen (falls Dualtyp)
  const defenderTypes = defenderType.split('/').map(type => translateTypeToEnglish(type.trim()));
  
  // Effektivität für jeden Verteidigertyp berechnen
  defenderTypes.forEach(defType => {
    if (typeEffectivenessChart[attackTypeEn] && typeEffectivenessChart[attackTypeEn][defType] !== undefined) {
      effectiveness *= typeEffectivenessChart[attackTypeEn][defType];
    }
  });
  
  return effectiveness;
}
```

## UI-Komponenten

### Chat-System

Das Chat-System ermöglicht die Kommunikation zwischen Spielern:

```javascript
// Chat-Funktionalität
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// Nachricht senden
function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('chat-message', message);
    chatInput.value = '';
  }
}

// Event-Listener für den Senden-Button
sendButton.addEventListener('click', sendMessage);

// Event-Listener für die Enter-Taste
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Nachricht empfangen
socket.on('chat-message', (message) => {
  const isOwnMessage = message.senderId === myId;

  // Erstelle das Nachrichten-Element
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;

  // Füge den Absender hinzu (nur bei fremden Nachrichten)
  if (!isOwnMessage) {
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = message.sender;
    messageDiv.appendChild(senderDiv);
  }

  // Füge den Nachrichtentext hinzu
  const textDiv = document.createElement('div');
  textDiv.textContent = message.text;
  messageDiv.appendChild(textDiv);

  // Füge den Zeitstempel hinzu
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  const date = new Date(message.timestamp);
  timeDiv.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageDiv.appendChild(timeDiv);

  // Füge die Nachricht zum Chat hinzu
  chatMessages.appendChild(messageDiv);

  // Scrolle zum Ende des Chats
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
```

### Optionsmenü

Das Optionsmenü ermöglicht die Anpassung der Spieleinstellungen:

```javascript
// Optionen-Modal-Funktionalität
const modal = document.getElementById('optionsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveOptionsBtn = document.getElementById('saveOptionsBtn');
const resolutionSelect = document.getElementById('resolutionSelect');
const gameCanvas = document.getElementById('gameCanvas');

// Lade gespeicherte Einstellungen
function loadSettings() {
  const savedResolution = localStorage.getItem('gameResolution');
  if (savedResolution) {
    resolutionSelect.value = savedResolution;
    applyResolution(savedResolution);
  }
}

// Wende die ausgewählte Auflösung an
function applyResolution(resolution) {
  const [width, height] = resolution.split('x').map(Number);
  
  // Canvas-Größe ändern
  gameCanvas.width = width;
  gameCanvas.height = height;
  
  // Einstellung speichern
  localStorage.setItem('gameResolution', resolution);
  
  console.log(`Auflösung auf ${width}x${height} geändert`);
}

// Event-Listener für das Öffnen des Modals
settingsBtn.addEventListener('click', () => {
  modal.style.display = 'block';
});

// Event-Listener für das Schließen des Modals
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Speichere die Einstellungen
saveOptionsBtn.addEventListener('click', () => {
  const selectedResolution = resolutionSelect.value;
  applyResolution(selectedResolution);
  modal.style.display = 'none';
});
```

## Sicherheitsaspekte

### Passwort-Hashing

Passwörter werden mit bcrypt gehasht:

```javascript
// Passwort hashen
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Neuen Spieler erstellen
const newPlayer = await db.Player.create({
  username,
  password_hash: hashedPassword,
  // Weitere Felder...
});
```

### Authentifizierungs-Middleware

Die Authentifizierungs-Middleware schützt geschützte Routen:

```javascript
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
```

## Startskripte

### start.bat

```batch
@echo off
echo Starte PokeTogetherBrowser...
node server/index.js
pause
```

### start_game.bat

```batch
@echo off
echo Starte Multiplayer Wiese mit Benutzerverwaltung...
echo.
echo Dieser Batch-Datei startet den Server und oeffnet den Client im Browser.
echo.

REM Starte den Server im Hintergrund
start cmd /k "cd server && node "C:\Users\Matthias\Documents\augment-projects\PokeTogetherBrowser\server\index.js""

REM Warte kurz, damit der Server Zeit hat zu starten
timeout /t 2 /nobreak > nul

REM Oeffne den Client im Browser
start "" "http://localhost:3000"
```

## Zusammenfassung

PokeTogetherBrowser ist ein technisch anspruchsvolles Projekt, das moderne Webtechnologien mit klassischen Spielmechaniken kombiniert. Die Architektur ist modular aufgebaut und ermöglicht eine klare Trennung zwischen Client und Server. Die Implementierung umfasst ein komplexes Datenmodell, Echtzeit-Kommunikation, Benutzerauthentifizierung und verschiedene Spielmechaniken wie das Pokémon-Kampfsystem und die Inventarverwaltung.
