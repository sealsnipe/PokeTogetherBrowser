# Benutzerauthentifizierung für PokeTogetherBrowser - Teil 1

## Übersicht

Die Benutzerauthentifizierung ist ein kritischer Bestandteil des Spiels, um Spielerdaten zu schützen und eine personalisierte Spielerfahrung zu ermöglichen. Wir implementieren ein sicheres Login-System mit Passwort-Hashing, JWT-Tokens für die Sitzungsverwaltung und Middleware für geschützte Routen.

## Technologien und Pakete

Für die Implementierung der Benutzerauthentifizierung benötigen wir folgende Pakete:

```bash
npm install bcrypt jsonwebtoken express-validator cookie-parser
```

- **bcrypt**: Für sicheres Passwort-Hashing
- **jsonwebtoken**: Für die Erstellung und Validierung von JWT-Tokens
- **express-validator**: Für die Validierung von Eingabedaten
- **cookie-parser**: Für die Verwaltung von Cookies

## Benutzermodell erweitern

Wir erweitern das Spieler-Modell um zusätzliche Authentifizierungsfelder:

```javascript
// models/Player.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

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
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'player',
      validate: {
        isIn: [['player', 'moderator', 'admin']]
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE
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
    }
  }, {
    timestamps: true,
    hooks: {
      // Hash das Passwort vor dem Speichern
      beforeCreate: async (player) => {
        if (player.password_hash) {
          player.password_hash = await bcrypt.hash(player.password_hash, 10);
        }
      },
      beforeUpdate: async (player) => {
        if (player.changed('password_hash')) {
          player.password_hash = await bcrypt.hash(player.password_hash, 10);
        }
      }
    }
  });

  // Instanz-Methode zum Überprüfen des Passworts
  Player.prototype.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  return Player;
};
```

## Authentifizierungs-Controller

Wir erstellen einen Controller für die Authentifizierungsfunktionen:

```javascript
// controllers/authController.js
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../models');

// JWT-Secret aus Umgebungsvariablen oder Fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Token-Gültigkeit: 7 Tage
const JWT_EXPIRES_IN = '7d';

// Registrierung
exports.register = async (req, res) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await db.Player.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Benutzername oder E-Mail bereits vergeben'
      });
    }

    // Neuen Benutzer erstellen
    const newPlayer = await db.Player.create({
      username,
      email,
      password_hash: password, // Wird durch Hook gehasht
      last_login: new Date()
    });

    // Starter-Pokémon und Items hinzufügen
    await addStarterItems(newPlayer.id);

    // JWT-Token erstellen
    const token = jwt.sign(
      { id: newPlayer.id, username: newPlayer.username, role: newPlayer.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Token als Cookie setzen
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
    });

    // Erfolgreiche Antwort senden
    res.status(201).json({
      message: 'Registrierung erfolgreich',
      player: {
        id: newPlayer.id,
        username: newPlayer.username,
        email: newPlayer.email,
        role: newPlayer.role
      }
    });
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
};

// Login
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

    // Letzte Anmeldung aktualisieren
    player.last_login = new Date();
    await player.save();

    // JWT-Token erstellen
    const token = jwt.sign(
      { id: player.id, username: player.username, role: player.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Token als Cookie setzen
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
    });

    // Erfolgreiche Antwort senden
    res.status(200).json({
      message: 'Anmeldung erfolgreich',
      player: {
        id: player.id,
        username: player.username,
        email: player.email,
        role: player.role
      }
    });
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
};

// Logout
exports.logout = (req, res) => {
  // Token-Cookie löschen
  res.clearCookie('token');
  res.status(200).json({ message: 'Abmeldung erfolgreich' });
};

// Hilfsfunktion zum Hinzufügen von Starter-Items und Pokémon
async function addStarterItems(playerId) {
  try {
    // Starter-Items hinzufügen
    const starterItems = [
      { itemId: 1, quantity: 5 },  // 5 Pokébälle
      { itemId: 4, quantity: 3 },  // 3 Tränke
      { itemId: 10, quantity: 1 }  // 1 Eichs Paket
    ];

    for (const item of starterItems) {
      await db.InventoryItem.create({
        PlayerId: playerId,
        ItemId: item.itemId,
        quantity: item.quantity
      });
    }

    // Zufälliges Starter-Pokémon auswählen (Bisasam, Glumanda oder Schiggy)
    const starterIds = [1, 4, 7]; // Pokédex-Nummern der Starter
    const randomStarterId = starterIds[Math.floor(Math.random() * starterIds.length)];
    
    const starterPokemon = await db.PokemonBase.findOne({
      where: { pokedex_number: randomStarterId }
    });

    if (starterPokemon) {
      // Starter-Pokémon zum Team hinzufügen
      const level = 5;
      const maxHp = Math.floor(starterPokemon.base_hp * (level / 50 + 1));
      
      await db.PlayerPokemon.create({
        PlayerId: playerId,
        PokemonBaseId: starterPokemon.id,
        nickname: null,
        level: level,
        current_hp: maxHp,
        max_hp: maxHp,
        experience: 0,
        is_in_team: true,
        team_position: 0,
        caught_location: 'Starter'
      });
    }
  } catch (error) {
    console.error('Fehler beim Hinzufügen von Starter-Items:', error);
    throw error;
  }
}
