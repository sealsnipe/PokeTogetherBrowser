# Spielstand-Speicherung für PokeTogetherBrowser - Teil 1

## Übersicht

Die Spielstand-Speicherung ist ein zentraler Bestandteil des Spiels, der es den Spielern ermöglicht, ihren Fortschritt zu speichern und bei der nächsten Anmeldung fortzusetzen. Wir implementieren ein umfassendes System zur Speicherung und Verwaltung von Spielerdaten, einschließlich Position, Inventar, Pokémon-Team und Spielfortschritt.

## Spielstand-Komponenten

Der Spielstand eines Spielers besteht aus mehreren Komponenten:

1. **Spieler-Grunddaten**:
   - Position in der Spielwelt
   - Laufstatus (Gehen/Rennen)
   - Letzte Anmeldung

2. **Inventar**:
   - Besitztümer des Spielers (Items)
   - Anzahl jedes Items

3. **Pokémon-Team und Lager**:
   - Pokémon im aktiven Team
   - Pokémon im Lager
   - Eigenschaften jedes Pokémon (Level, HP, Attacken, etc.)

4. **Spielfortschritt**:
   - Abgeschlossene Quests
   - Freigeschaltete Bereiche
   - Errungenschaften

## Datenmodelle für die Spielstand-Speicherung

### 1. Spieler-Grunddaten

Das Spieler-Modell haben wir bereits in der Datenbank-Integration und Benutzerauthentifizierung definiert. Wir erweitern es um zusätzliche Felder für den Spielfortschritt:

```javascript
// models/Player.js (Erweiterung)
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const Player = sequelize.define('Player', {
    // Bestehende Felder...
    
    // Neue Felder für den Spielfortschritt
    current_map: {
      type: DataTypes.STRING(50),
      defaultValue: 'starter_town'
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
    money: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    play_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0  // In Sekunden
    },
    last_save: {
      type: DataTypes.DATE
    },
    last_heal: {
      type: DataTypes.DATE
    }
  });

  return Player;
};
```

### 2. Spielfortschritt-Modell

Wir erstellen ein neues Modell für den Spielfortschritt:

```javascript
// models/Progress.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Progress = sequelize.define('Progress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quest_key: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started'
    },
    progress_data: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    completed_at: {
      type: DataTypes.DATE
    }
  });

  return Progress;
};
```

### 3. Errungenschaften-Modell

```javascript
// models/Achievement.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    achievement_key: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    unlocked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Achievement;
};
```

### 4. Beziehungen zwischen den Modellen

Wir erweitern die Modell-Beziehungen:

```javascript
// models/index.js (Erweiterung)

// Spieler <-> Fortschritt (1:n)
db.Player.hasMany(db.Progress);
db.Progress.belongsTo(db.Player);

// Spieler <-> Errungenschaften (1:n)
db.Player.hasMany(db.Achievement);
db.Achievement.belongsTo(db.Player);
```

## Spielstand-Controller

Wir erstellen einen Controller für die Spielstand-Verwaltung:

```javascript
// controllers/saveController.js
const db = require('../models');

// Spielstand speichern
exports.saveGame = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { position, isRunning, currentMap } = req.body;

    // Spieler in der Datenbank suchen
    const player = await db.Player.findByPk(playerId);
    
    if (!player) {
      return res.status(404).json({ message: 'Spieler nicht gefunden' });
    }

    // Spieler-Grunddaten aktualisieren
    if (position) {
      player.position_x = position.x;
      player.position_y = position.y;
    }
    
    if (isRunning !== undefined) {
      player.is_running = isRunning;
    }
    
    if (currentMap) {
      player.current_map = currentMap;
    }
    
    // Spielzeit aktualisieren (falls vorhanden)
    if (req.body.playTime) {
      player.play_time += req.body.playTime;
    }
    
    // Letzten Speicherzeitpunkt aktualisieren
    player.last_save = new Date();
    
    await player.save();

    res.status(200).json({
      message: 'Spielstand erfolgreich gespeichert',
      timestamp: player.last_save
    });
  } catch (error) {
    console.error('Fehler beim Speichern des Spielstands:', error);
    res.status(500).json({ message: 'Serverfehler beim Speichern des Spielstands' });
  }
};

// Spielstand laden
exports.loadGame = async (req, res) => {
  try {
    const playerId = req.player.id;

    // Spieler mit allen zugehörigen Daten laden
    const player = await db.Player.findByPk(playerId, {
      include: [
        {
          model: db.InventoryItem,
          include: [db.Item]
        },
        {
          model: db.PlayerPokemon,
          include: [
            db.PokemonBase,
            {
              model: db.Move,
              through: db.PokemonMove
            }
          ]
        },
        db.Progress,
        db.Achievement
      ]
    });
    
    if (!player) {
      return res.status(404).json({ message: 'Spieler nicht gefunden' });
    }

    // Spielerdaten formatieren
    const gameData = {
      player: {
        id: player.id,
        username: player.username,
        position: {
          x: player.position_x,
          y: player.position_y
        },
        isRunning: player.is_running,
        currentMap: player.current_map,
        money: player.money,
        playTime: player.play_time,
        lastSave: player.last_save
      },
      inventory: player.InventoryItems.map(item => ({
        id: item.Item.id,
        name: item.Item.name,
        type: item.Item.type,
        quantity: item.quantity,
        icon: item.Item.icon
      })),
      pokemon: player.PlayerPokemons.map(pokemon => ({
        id: pokemon.id,
        name: pokemon.PokemonBase.name,
        nickname: pokemon.nickname,
        level: pokemon.level,
        type: pokemon.PokemonBase.secondary_type 
          ? `${pokemon.PokemonBase.primary_type}/${pokemon.PokemonBase.secondary_type}`
          : pokemon.PokemonBase.primary_type,
        hp: pokemon.current_hp,
        maxHp: pokemon.max_hp,
        experience: pokemon.experience,
        isInTeam: pokemon.is_in_team,
        teamPosition: pokemon.team_position,
        moves: pokemon.Moves.map(move => ({
          id: move.id,
          name: move.name,
          type: move.type,
          power: move.power,
          accuracy: move.accuracy,
          pp: move.PokemonMove.pp_current,
          maxPp: move.PokemonMove.pp_max
        }))
      })),
      progress: player.Progresses.map(progress => ({
        questKey: progress.quest_key,
        status: progress.status,
        data: progress.progress_data,
        completedAt: progress.completed_at
      })),
      achievements: player.Achievements.map(achievement => ({
        key: achievement.achievement_key,
        unlockedAt: achievement.unlocked_at
      }))
    };

    res.status(200).json(gameData);
  } catch (error) {
    console.error('Fehler beim Laden des Spielstands:', error);
    res.status(500).json({ message: 'Serverfehler beim Laden des Spielstands' });
  }
};

// Inventar aktualisieren
exports.updateInventory = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Ungültiges Format für Items' });
    }

    // Transaktion starten
    const transaction = await db.sequelize.transaction();

    try {
      for (const item of items) {
        const { itemId, quantity, action } = item;

        // Item in der Datenbank suchen
        const inventoryItem = await db.InventoryItem.findOne({
          where: {
            PlayerId: playerId,
            ItemId: itemId
          },
          transaction
        });

        if (action === 'add') {
          if (inventoryItem) {
            // Item bereits vorhanden, Anzahl erhöhen
            inventoryItem.quantity += quantity;
            await inventoryItem.save({ transaction });
          } else {
            // Neues Item hinzufügen
            await db.InventoryItem.create({
              PlayerId: playerId,
              ItemId: itemId,
              quantity: quantity
            }, { transaction });
          }
        } else if (action === 'remove') {
          if (inventoryItem) {
            // Anzahl reduzieren
            inventoryItem.quantity -= quantity;
            
            if (inventoryItem.quantity <= 0) {
              // Item entfernen, wenn Anzahl 0 oder weniger
              await inventoryItem.destroy({ transaction });
            } else {
              await inventoryItem.save({ transaction });
            }
          }
        } else if (action === 'set') {
          if (inventoryItem) {
            // Anzahl setzen
            if (quantity <= 0) {
              // Item entfernen, wenn Anzahl 0 oder weniger
              await inventoryItem.destroy({ transaction });
            } else {
              inventoryItem.quantity = quantity;
              await inventoryItem.save({ transaction });
            }
          } else if (quantity > 0) {
            // Neues Item hinzufügen
            await db.InventoryItem.create({
              PlayerId: playerId,
              ItemId: itemId,
              quantity: quantity
            }, { transaction });
          }
        }
      }

      // Transaktion bestätigen
      await transaction.commit();

      // Aktualisiertes Inventar laden
      const updatedInventory = await db.InventoryItem.findAll({
        where: { PlayerId: playerId },
        include: [db.Item]
      });

      res.status(200).json({
        message: 'Inventar erfolgreich aktualisiert',
        inventory: updatedInventory.map(item => ({
          id: item.Item.id,
          name: item.Item.name,
          type: item.Item.type,
          quantity: item.quantity,
          icon: item.Item.icon
        }))
      });
    } catch (error) {
      // Transaktion zurückrollen bei Fehler
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Inventars:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Inventars' });
  }
};
```
