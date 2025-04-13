# Datenbank-Integration für PokeTogetherBrowser

## Übersicht

Die Datenbank-Integration ist der erste Schritt, um persistente Spielerdaten zu ermöglichen. Wir werden eine relationale Datenbankstruktur implementieren, die alle Aspekte des Spiels abdeckt: Spieler, Items, Pokémon und deren Beziehungen.

## Datenbankauswahl

Für die Entwicklung verwenden wir SQLite, da es einfach zu konfigurieren ist und keine separate Serverinstallation erfordert. Für die Produktion könnte später auf PostgreSQL oder MySQL umgestellt werden.

### Vorteile von SQLite für die Entwicklung:
- Keine Installation erforderlich
- Datei-basiert, einfach zu sichern
- Ausreichende Performance für Entwicklung und kleine Deployments
- Einfache Migration zu anderen Datenbanksystemen möglich

## ORM-Auswahl

Wir verwenden Sequelize als ORM (Object-Relational Mapping), um die Datenbankinteraktion zu vereinfachen:

```bash
npm install sequelize sqlite3
```

## Datenbankschema

### 1. Spieler-Tabelle (`players`)

```javascript
// models/Player.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    position_x: {
      type: DataTypes.FLOAT,
      defaultValue: 250
    },
    position_y: {
      type: DataTypes.FLOAT,
      defaultValue: 250
    },
    is_running: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_login: {
      type: DataTypes.DATE
    }
  });

  return Player;
};
```

### 2. Items-Grunddaten-Tabelle (`items`)

```javascript
// models/Item.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Item = sequelize.define('Item', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // 'ball', 'medicine', 'hold', 'tm', 'hm', 'quest', 'berry', 'other'
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(10)
    },
    usable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    effect: {
      type: DataTypes.TEXT
    }
  });

  return Item;
};
```

### 3. Inventar-Tabelle (`inventory_items`)

```javascript
// models/InventoryItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  });

  return InventoryItem;
};
```

### 4. Pokémon-Grunddaten-Tabelle (`pokemon_base`)

```javascript
// models/PokemonBase.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PokemonBase = sequelize.define('PokemonBase', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pokedex_number: {
      type: DataTypes.INTEGER,
      unique: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    primary_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    secondary_type: {
      type: DataTypes.STRING(20)
    },
    base_hp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_attack: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_defense: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_special_attack: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_special_defense: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_speed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    evolution_level: {
      type: DataTypes.INTEGER
    },
    evolution_method: {
      type: DataTypes.STRING(50)
    },
    description: {
      type: DataTypes.TEXT
    }
  });

  return PokemonBase;
};
```

### 5. Spieler-Pokémon-Tabelle (`player_pokemon`)

```javascript
// models/PlayerPokemon.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlayerPokemon = sequelize.define('PlayerPokemon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: DataTypes.STRING(50)
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    current_hp: {
      type: DataTypes.INTEGER
    },
    max_hp: {
      type: DataTypes.INTEGER
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_in_team: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    team_position: {
      type: DataTypes.INTEGER
      // 0-9 für Team, NULL für Lager
    },
    caught_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    caught_location: {
      type: DataTypes.STRING(50)
    }
  });

  return PlayerPokemon;
};
```

### 6. Attacken-Grunddaten-Tabelle (`moves`)

```javascript
// models/Move.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Move = sequelize.define('Move', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false
      // 'physical', 'special', 'status'
    },
    power: {
      type: DataTypes.INTEGER
    },
    accuracy: {
      type: DataTypes.INTEGER
    },
    pp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    effect: {
      type: DataTypes.TEXT
    },
    description: {
      type: DataTypes.TEXT
    }
  });

  return Move;
};
```

### 7. Pokémon-Attacken-Tabelle (`pokemon_moves`)

```javascript
// models/PokemonMove.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PokemonMove = sequelize.define('PokemonMove', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pp_current: {
      type: DataTypes.INTEGER
    },
    pp_max: {
      type: DataTypes.INTEGER
    },
    move_slot: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
      }
    }
  });

  return PokemonMove;
};
```

## Modell-Beziehungen

Die Beziehungen zwischen den Modellen werden in einer separaten Datei definiert:

```javascript
// models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Datenbankverbindung herstellen
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

// Modelle laden
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// Beziehungen definieren
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Spieler <-> Inventar-Items (1:n)
db.Player.hasMany(db.InventoryItem);
db.InventoryItem.belongsTo(db.Player);

// Item <-> Inventar-Items (1:n)
db.Item.hasMany(db.InventoryItem);
db.InventoryItem.belongsTo(db.Item);

// Spieler <-> Pokémon (1:n)
db.Player.hasMany(db.PlayerPokemon);
db.PlayerPokemon.belongsTo(db.Player);

// Pokémon-Basis <-> Spieler-Pokémon (1:n)
db.PokemonBase.hasMany(db.PlayerPokemon);
db.PlayerPokemon.belongsTo(db.PokemonBase);

// Pokémon-Basis <-> Evolution (1:n)
db.PokemonBase.hasMany(db.PokemonBase, { as: 'Evolutions', foreignKey: 'evolves_from_id' });
db.PokemonBase.belongsTo(db.PokemonBase, { as: 'EvolvesFrom', foreignKey: 'evolves_from_id' });

// Spieler-Pokémon <-> Attacken (n:m)
db.PlayerPokemon.belongsToMany(db.Move, { through: db.PokemonMove });
db.Move.belongsToMany(db.PlayerPokemon, { through: db.PokemonMove });

// Item <-> Spieler-Pokémon (Halte-Item) (1:n)
db.Item.hasMany(db.PlayerPokemon, { as: 'HeldBy', foreignKey: 'held_item_id' });
db.PlayerPokemon.belongsTo(db.Item, { as: 'HeldItem', foreignKey: 'held_item_id' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
```

## Datenbank-Initialisierung

Die Datenbank wird beim Serverstart initialisiert:

```javascript
// db/init.js
const db = require('../models');
const initialData = require('./seed-data');

async function initDatabase() {
  try {
    // Tabellen erstellen/synchronisieren
    await db.sequelize.sync({ force: process.env.NODE_ENV !== 'production' });
    console.log('Datenbank wurde erfolgreich synchronisiert');
    
    // Beispieldaten einfügen, wenn wir nicht in Produktion sind
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }
  } catch (error) {
    console.error('Fehler beim Initialisieren der Datenbank:', error);
  }
}

async function seedDatabase() {
  try {
    // Items einfügen
    await db.Item.bulkCreate(initialData.items);
    console.log('Items wurden eingefügt');
    
    // Pokémon-Grunddaten einfügen
    await db.PokemonBase.bulkCreate(initialData.pokemonBase);
    console.log('Pokémon-Grunddaten wurden eingefügt');
    
    // Attacken einfügen
    await db.Move.bulkCreate(initialData.moves);
    console.log('Attacken wurden eingefügt');
    
    // Testbenutzer einfügen
    const testUsers = [
      { username: 'test1', password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789' },
      { username: 'test2', password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789' },
      { username: 'test3', password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789' }
    ];
    
    await db.Player.bulkCreate(testUsers);
    console.log('Testbenutzer wurden eingefügt');
    
    // Beispiel-Inventar für Testbenutzer
    const player = await db.Player.findOne({ where: { username: 'test1' } });
    
    // Einige Items zum Inventar hinzufügen
    const items = await db.Item.findAll({ limit: 5 });
    for (const item of items) {
      await db.InventoryItem.create({
        PlayerId: player.id,
        ItemId: item.id,
        quantity: Math.floor(Math.random() * 10) + 1
      });
    }
    
    // Einige Pokémon zum Team hinzufügen
    const pokemonBases = await db.PokemonBase.findAll({ limit: 6 });
    for (let i = 0; i < pokemonBases.length; i++) {
      const base = pokemonBases[i];
      const level = Math.floor(Math.random() * 20) + 5;
      const maxHp = Math.floor(base.base_hp * (level / 50 + 1));
      
      await db.PlayerPokemon.create({
        PlayerId: player.id,
        PokemonBaseId: base.id,
        nickname: null,
        level: level,
        current_hp: maxHp,
        max_hp: maxHp,
        experience: level * 100,
        is_in_team: true,
        team_position: i,
        caught_location: 'Starter'
      });
    }
    
    console.log('Beispiel-Inventar und Pokémon wurden eingefügt');
  } catch (error) {
    console.error('Fehler beim Einfügen der Beispieldaten:', error);
  }
}

module.exports = { initDatabase };
```

## Beispieldaten

Die Beispieldaten werden in einer separaten Datei definiert:

```javascript
// db/seed-data.js
module.exports = {
  items: [
    { name: 'Pokéball', type: 'ball', description: 'Ein Gerät zum Fangen von Pokémon.', icon: '⬤', usable: true },
    { name: 'Superball', type: 'ball', description: 'Ein hochwertiger Ball mit höherer Erfolgsrate als ein normaler Pokéball.', icon: '⬤', usable: true },
    { name: 'Hyperball', type: 'ball', description: 'Ein sehr leistungsstarker Ball mit höherer Erfolgsrate als ein Superball.', icon: '⬤', usable: true },
    { name: 'Trank', type: 'medicine', description: 'Ein Spray-Typ-Medizin für Wunden. Es heilt die KP eines Pokémon um 20 Punkte.', icon: '⚕', usable: true },
    { name: 'Supertrank', type: 'medicine', description: 'Ein Spray-Typ-Medizin für Wunden. Es heilt die KP eines Pokémon um 50 Punkte.', icon: '⚕', usable: true },
    { name: 'Beleber', type: 'medicine', description: 'Ein Medikament, das ein kampfunfähiges Pokémon wiederbelebt.', icon: '⚕', usable: true },
    { name: 'Kampfknochen', type: 'hold', description: 'Ein Halte-Item, das die Stärke von Boden-Attacken erhöht.', icon: '⚔', usable: false },
    { name: 'Giftstich', type: 'tm', description: 'Eine TM, die die Attacke Giftstich enthält.', icon: 'TM', usable: true },
    { name: 'Surfer', type: 'hm', description: 'Eine VM, die die Attacke Surfer enthält.', icon: 'VM', usable: true },
    { name: 'Eichs Paket', type: 'quest', description: 'Ein Paket, das Professor Eich gehört.', icon: '✉', usable: false },
    { name: 'Prunusbeere', type: 'berry', description: 'Eine Beere, die ein Pokémon im Kampf heilt.', icon: '●', usable: true },
    { name: 'Amrenabeere', type: 'berry', description: 'Eine Beere, die ein Pokémon von Paralyse heilt.', icon: '●', usable: true },
    { name: 'Fahrrad', type: 'other', description: 'Ein Fahrrad, mit dem man schneller reisen kann.', icon: '⛹', usable: true },
    { name: 'Angelrute', type: 'other', description: 'Eine Rute zum Angeln von Wasser-Pokémon.', icon: '⸙', usable: true },
    { name: 'Flöte', type: 'other', description: 'Eine Flöte, die schlafende Pokémon aufweckt.', icon: '♫', usable: true }
  ],
  
  pokemonBase: [
    { pokedex_number: 1, name: 'Bisasam', primary_type: 'Pflanze', secondary_type: 'Gift', base_hp: 45, base_attack: 49, base_defense: 49, base_special_attack: 65, base_special_defense: 65, base_speed: 45, evolution_level: 16, description: 'Auf seinem Rücken trägt es einen Samen, der langsam wächst.' },
    { pokedex_number: 4, name: 'Glumanda', primary_type: 'Feuer', secondary_type: null, base_hp: 39, base_attack: 52, base_defense: 43, base_special_attack: 60, base_special_defense: 50, base_speed: 65, evolution_level: 16, description: 'Die Flamme auf seiner Schwanzspitze zeigt seine Lebensenergie an.' },
    { pokedex_number: 7, name: 'Schiggy', primary_type: 'Wasser', secondary_type: null, base_hp: 44, base_attack: 48, base_defense: 65, base_special_attack: 50, base_special_defense: 64, base_speed: 43, evolution_level: 16, description: 'Wenn es sich in seinen Panzer zurückzieht, spritzt es Wasser mit unglaublichem Druck.' },
    { pokedex_number: 25, name: 'Pikachu', primary_type: 'Elektro', secondary_type: null, base_hp: 35, base_attack: 55, base_defense: 40, base_special_attack: 50, base_special_defense: 50, base_speed: 90, evolution_level: null, description: 'Wenn es wütend ist, entlädt es sofort die Energie, die in den Elektrosäcken in seinen Wangen gespeichert ist.' },
    { pokedex_number: 16, name: 'Taubsi', primary_type: 'Normal', secondary_type: 'Flug', base_hp: 40, base_attack: 45, base_defense: 40, base_special_attack: 35, base_special_defense: 35, base_speed: 56, evolution_level: 18, description: 'Sehr freundlich und ein guter Sucher. Es kann seinen Weg nach Hause finden, egal wie weit es entfernt ist.' },
    { pokedex_number: 10, name: 'Raupy', primary_type: 'Käfer', secondary_type: null, base_hp: 45, base_attack: 30, base_defense: 35, base_special_attack: 20, base_special_defense: 20, base_speed: 45, evolution_level: 7, description: 'Es hat einen enormen Appetit. Es kann mehr als sein eigenes Gewicht an Blättern fressen.' }
  ],
  
  moves: [
    { name: 'Tackle', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, description: 'Ein körperlicher Angriff, bei dem der Anwender in das Ziel stürmt.' },
    { name: 'Kratzer', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, description: 'Harte, scharfe Krallen werden benutzt, um das Ziel zu kratzen.' },
    { name: 'Glut', type: 'Feuer', category: 'special', power: 40, accuracy: 100, pp: 25, description: 'Der Gegner wird mit kleinen Flammen attackiert, die ihn eventuell verbrennen.' },
    { name: 'Aquaknarre', type: 'Wasser', category: 'special', power: 40, accuracy: 100, pp: 25, description: 'Der Gegner wird mit einem Wasserstrahl attackiert.' },
    { name: 'Rankenhieb', type: 'Pflanze', category: 'physical', power: 45, accuracy: 100, pp: 25, description: 'Der Gegner wird mit rankenartigen Peitschen attackiert.' },
    { name: 'Donnerschock', type: 'Elektro', category: 'special', power: 40, accuracy: 100, pp: 30, description: 'Ein elektrischer Angriff, der den Gegner manchmal paralysiert.' },
    { name: 'Windstoss', type: 'Flug', category: 'special', power: 40, accuracy: 100, pp: 35, description: 'Der Gegner wird mit einem scharfen Windstoß attackiert.' },
    { name: 'Fadenschuss', type: 'Käfer', category: 'status', power: null, accuracy: 95, pp: 40, description: 'Der Gegner wird mit einem klebrigen Faden eingewickelt, der seine Initiative senkt.' }
  ]
};
```

## Integration in den Server

Die Datenbank wird in den Server integriert:

```javascript
// server/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { initDatabase } = require('./db/init');
const db = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, '../client')));

// Datenbank initialisieren
initDatabase();

// Socket.io-Verbindungen
io.on('connection', (socket) => {
  console.log('Neue Verbindung');
  
  // Login-Handler
  socket.on('login', async (data) => {
    try {
      // Benutzer in der Datenbank suchen
      const player = await db.Player.findOne({
        where: { username: data.username }
      });
      
      if (player) {
        // In einer echten Anwendung würde hier die Passwortüberprüfung stattfinden
        
        // Spielerdaten laden
        const inventory = await db.InventoryItem.findAll({
          where: { PlayerId: player.id },
          include: [db.Item]
        });
        
        const pokemon = await db.PlayerPokemon.findAll({
          where: { PlayerId: player.id },
          include: [db.PokemonBase],
          order: [['team_position', 'ASC']]
        });
        
        // Letzte Anmeldung aktualisieren
        player.last_login = new Date();
        await player.save();
        
        // Spieler mit Socket verknüpfen
        socket.playerId = player.id;
        socket.username = player.username;
        
        // Spielerdaten an den Client senden
        socket.emit('login success', {
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
        
        // Anderen Spielern mitteilen, dass ein neuer Spieler verbunden ist
        socket.broadcast.emit('player joined', {
          id: player.id,
          username: player.username,
          position: {
            x: player.position_x,
            y: player.position_y
          }
        });
        
        console.log(`Spieler ${player.username} hat sich angemeldet`);
      } else {
        // Benutzer nicht gefunden
        socket.emit('login error', { message: 'Benutzer nicht gefunden' });
      }
    } catch (error) {
      console.error('Fehler beim Login:', error);
      socket.emit('login error', { message: 'Ein Fehler ist aufgetreten' });
    }
  });
  
  // Bewegungs-Handler
  socket.on('move', async (data) => {
    if (!socket.playerId) return;
    
    try {
      // Position in der Datenbank aktualisieren
      const player = await db.Player.findByPk(socket.playerId);
      if (player) {
        player.position_x = data.x;
        player.position_y = data.y;
        await player.save();
      }
      
      // Anderen Spielern die neue Position mitteilen
      socket.broadcast.emit('player moved', {
        id: socket.playerId,
        username: socket.username,
        position: {
          x: data.x,
          y: data.y
        }
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Position:', error);
    }
  });
  
  // Trennung
  socket.on('disconnect', () => {
    if (socket.playerId) {
      // Anderen Spielern mitteilen, dass ein Spieler getrennt wurde
      socket.broadcast.emit('player left', {
        id: socket.playerId,
        username: socket.username
      });
      
      console.log(`Spieler ${socket.username} hat sich abgemeldet`);
    }
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
```

## Zusammenfassung

Die Datenbank-Integration umfasst:

1. **Datenbankschema**: Definition aller Tabellen und ihrer Beziehungen
2. **ORM-Integration**: Verwendung von Sequelize für die Datenbankinteraktion
3. **Datenbank-Initialisierung**: Erstellung der Tabellen und Einfügen von Beispieldaten
4. **Server-Integration**: Anpassung des Servers, um die Datenbank zu verwenden

Diese Implementierung ermöglicht:

- Persistente Speicherung von Spielerdaten
- Verwaltung von Inventar und Pokémon
- Grundlage für weitere Spielmechaniken wie Kämpfe und Evolution

Im nächsten Schritt werden wir die Benutzerauthentifizierung implementieren, um ein sicheres Login-System zu schaffen.
