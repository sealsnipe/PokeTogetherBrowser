# Weitere Spielmechaniken für PokeTogetherBrowser - Teil 1: Kampfsystem

## Übersicht

In diesem Abschnitt implementieren wir ein umfassendes Kampfsystem, das es Spielern ermöglicht, mit ihren Pokémon gegen wilde Pokémon und andere Spieler zu kämpfen. Das Kampfsystem umfasst Rundenbasierte Kämpfe, Statuseffekte, Typ-Effektivität und Erfahrungspunkte.

## Datenmodelle für das Kampfsystem

### 1. Kampf-Modell

```javascript
// models/Battle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Battle = sequelize.define('Battle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('wild', 'trainer', 'player'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'player1_won', 'player2_won', 'draw', 'fled'),
      defaultValue: 'active'
    },
    current_turn: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    player1_active_pokemon: {
      type: DataTypes.INTEGER
    },
    player2_active_pokemon: {
      type: DataTypes.INTEGER
    },
    battle_data: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ended_at: {
      type: DataTypes.DATE
    }
  });

  return Battle;
};
```

### 2. Kampfaktion-Modell

```javascript
// models/BattleAction.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BattleAction = sequelize.define('BattleAction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    turn: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action_type: {
      type: DataTypes.ENUM('attack', 'switch', 'item', 'flee'),
      allowNull: false
    },
    target_position: {
      type: DataTypes.INTEGER
    },
    move_id: {
      type: DataTypes.INTEGER
    },
    item_id: {
      type: DataTypes.INTEGER
    },
    pokemon_id: {
      type: DataTypes.INTEGER
    },
    result: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return BattleAction;
};
```

### 3. Beziehungen zwischen den Modellen

```javascript
// models/index.js (Erweiterung)

// Spieler <-> Kämpfe (1:n)
db.Player.hasMany(db.Battle, { as: 'Player1Battles', foreignKey: 'player1_id' });
db.Battle.belongsTo(db.Player, { as: 'Player1', foreignKey: 'player1_id' });

db.Player.hasMany(db.Battle, { as: 'Player2Battles', foreignKey: 'player2_id' });
db.Battle.belongsTo(db.Player, { as: 'Player2', foreignKey: 'player2_id' });

// Kampf <-> Kampfaktionen (1:n)
db.Battle.hasMany(db.BattleAction);
db.BattleAction.belongsTo(db.Battle);
```

## Kampfsystem-Controller

```javascript
// controllers/battleController.js
const db = require('../models');

// Kampf starten
exports.startBattle = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { type, opponentId, wildPokemonId } = req.body;

    // Validierung
    if (!type || !['wild', 'trainer', 'player'].includes(type)) {
      return res.status(400).json({ message: 'Ungültiger Kampftyp' });
    }

    // Spieler mit Pokémon-Team laden
    const player = await db.Player.findByPk(playerId, {
      include: [
        {
          model: db.PlayerPokemon,
          where: { is_in_team: true },
          include: [
            db.PokemonBase,
            {
              model: db.Move,
              through: db.PokemonMove
            }
          ]
        }
      ]
    });

    if (!player || player.PlayerPokemons.length === 0) {
      return res.status(400).json({ message: 'Keine Pokémon im Team' });
    }

    // Kampfdaten vorbereiten
    let battleData = {};
    let player2Id = null;

    switch (type) {
      case 'wild':
        // Wildes Pokémon generieren
        if (!wildPokemonId) {
          return res.status(400).json({ message: 'Keine wilde Pokémon-ID angegeben' });
        }
        
        const wildPokemon = await generateWildPokemon(wildPokemonId);
        battleData.wildPokemon = wildPokemon;
        break;

      case 'trainer':
        // Trainer-Kampf (NPC)
        // Implementierung für Trainer-Kämpfe
        return res.status(501).json({ message: 'Trainer-Kämpfe noch nicht implementiert' });

      case 'player':
        // Spieler-Kampf
        if (!opponentId) {
          return res.status(400).json({ message: 'Keine Gegner-ID angegeben' });
        }
        
        // Gegner laden
        const opponent = await db.Player.findByPk(opponentId, {
          include: [
            {
              model: db.PlayerPokemon,
              where: { is_in_team: true },
              include: [
                db.PokemonBase,
                {
                  model: db.Move,
                  through: db.PokemonMove
                }
              ]
            }
          ]
        });
        
        if (!opponent || opponent.PlayerPokemons.length === 0) {
          return res.status(400).json({ message: 'Gegner hat keine Pokémon im Team' });
        }
        
        player2Id = opponentId;
        break;
    }

    // Kampf erstellen
    const battle = await db.Battle.create({
      type,
      player1_id: playerId,
      player2_id: player2Id,
      player1_active_pokemon: player.PlayerPokemons[0].id,
      player2_active_pokemon: type === 'player' ? null : 0, // Bei wilden Pokémon ist der Index 0
      battle_data: battleData
    });

    // Kampfdaten für die Antwort vorbereiten
    const battleResponse = {
      id: battle.id,
      type: battle.type,
      status: battle.status,
      currentTurn: battle.current_turn,
      player1: {
        id: player.id,
        username: player.username,
        activePokemon: formatPokemonForBattle(player.PlayerPokemons[0])
      }
    };

    if (type === 'wild') {
      battleResponse.wildPokemon = battleData.wildPokemon;
    } else if (type === 'player') {
      const opponent = await db.Player.findByPk(player2Id, {
        include: [
          {
            model: db.PlayerPokemon,
            where: { id: battle.player2_active_pokemon },
            include: [db.PokemonBase]
          }
        ]
      });
      
      battleResponse.player2 = {
        id: opponent.id,
        username: opponent.username,
        activePokemon: formatPokemonForBattle(opponent.PlayerPokemons[0])
      };
    }

    res.status(201).json(battleResponse);
  } catch (error) {
    console.error('Fehler beim Starten des Kampfes:', error);
    res.status(500).json({ message: 'Serverfehler beim Starten des Kampfes' });
  }
};

// Kampfaktion ausführen
exports.performAction = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { battleId, actionType, moveId, pokemonId, itemId, targetPosition } = req.body;

    // Validierung
    if (!battleId || !actionType || !['attack', 'switch', 'item', 'flee'].includes(actionType)) {
      return res.status(400).json({ message: 'Ungültige Kampfaktion' });
    }

    // Kampf laden
    const battle = await db.Battle.findByPk(battleId);
    
    if (!battle) {
      return res.status(404).json({ message: 'Kampf nicht gefunden' });
    }
    
    if (battle.status !== 'active') {
      return res.status(400).json({ message: 'Kampf ist bereits beendet' });
    }
    
    // Prüfen, ob der Spieler an diesem Kampf teilnimmt
    if (battle.player1_id !== playerId && battle.player2_id !== playerId) {
      return res.status(403).json({ message: 'Nicht berechtigt, an diesem Kampf teilzunehmen' });
    }

    // Kampfaktion erstellen
    const battleAction = await db.BattleAction.create({
      BattleId: battleId,
      turn: battle.current_turn,
      player_id: playerId,
      action_type: actionType,
      move_id: moveId,
      pokemon_id: pokemonId,
      item_id: itemId,
      target_position: targetPosition
    });

    // Kampfaktion ausführen
    let actionResult;
    switch (actionType) {
      case 'attack':
        actionResult = await performAttack(battle, playerId, moveId, targetPosition);
        break;
      
      case 'switch':
        actionResult = await switchPokemon(battle, playerId, pokemonId);
        break;
      
      case 'item':
        actionResult = await useItem(battle, playerId, itemId, targetPosition);
        break;
      
      case 'flee':
        actionResult = await attemptFlee(battle, playerId);
        break;
    }

    // Kampfaktion aktualisieren
    battleAction.result = actionResult;
    await battleAction.save();

    // Kampf aktualisieren
    if (actionResult.battleEnded) {
      battle.status = actionResult.battleResult;
      battle.ended_at = new Date();
    } else if (actionResult.nextTurn) {
      battle.current_turn += 1;
    }
    
    if (actionResult.player1ActivePokemon) {
      battle.player1_active_pokemon = actionResult.player1ActivePokemon;
    }
    
    if (actionResult.player2ActivePokemon) {
      battle.player2_active_pokemon = actionResult.player2ActivePokemon;
    }
    
    await battle.save();

    // Antwort senden
    res.status(200).json({
      action: {
        id: battleAction.id,
        type: actionType,
        result: actionResult
      },
      battle: {
        id: battle.id,
        status: battle.status,
        currentTurn: battle.current_turn
      }
    });
  } catch (error) {
    console.error('Fehler beim Ausführen der Kampfaktion:', error);
    res.status(500).json({ message: 'Serverfehler beim Ausführen der Kampfaktion' });
  }
};

// Kampf laden
exports.getBattle = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { battleId } = req.params;

    // Kampf laden
    const battle = await db.Battle.findByPk(battleId, {
      include: [
        {
          model: db.Player,
          as: 'Player1',
          attributes: ['id', 'username']
        },
        {
          model: db.Player,
          as: 'Player2',
          attributes: ['id', 'username']
        },
        {
          model: db.BattleAction,
          order: [['turn', 'ASC'], ['timestamp', 'ASC']]
        }
      ]
    });
    
    if (!battle) {
      return res.status(404).json({ message: 'Kampf nicht gefunden' });
    }
    
    // Prüfen, ob der Spieler an diesem Kampf teilnimmt
    if (battle.player1_id !== playerId && battle.player2_id !== playerId) {
      return res.status(403).json({ message: 'Nicht berechtigt, diesen Kampf einzusehen' });
    }

    // Aktive Pokémon laden
    let player1ActivePokemon = null;
    let player2ActivePokemon = null;
    
    if (battle.player1_active_pokemon) {
      const pokemon = await db.PlayerPokemon.findByPk(battle.player1_active_pokemon, {
        include: [
          db.PokemonBase,
          {
            model: db.Move,
            through: db.PokemonMove
          }
        ]
      });
      
      if (pokemon) {
        player1ActivePokemon = formatPokemonForBattle(pokemon);
      }
    }
    
    if (battle.type === 'wild') {
      player2ActivePokemon = battle.battle_data.wildPokemon;
    } else if (battle.player2_active_pokemon) {
      const pokemon = await db.PlayerPokemon.findByPk(battle.player2_active_pokemon, {
        include: [
          db.PokemonBase,
          {
            model: db.Move,
            through: db.PokemonMove
          }
        ]
      });
      
      if (pokemon) {
        player2ActivePokemon = formatPokemonForBattle(pokemon);
      }
    }

    // Kampfdaten für die Antwort vorbereiten
    const battleResponse = {
      id: battle.id,
      type: battle.type,
      status: battle.status,
      currentTurn: battle.current_turn,
      startedAt: battle.started_at,
      endedAt: battle.ended_at,
      player1: {
        id: battle.Player1.id,
        username: battle.Player1.username,
        activePokemon: player1ActivePokemon
      },
      actions: battle.BattleActions.map(action => ({
        id: action.id,
        turn: action.turn,
        playerId: action.player_id,
        type: action.action_type,
        result: action.result,
        timestamp: action.timestamp
      }))
    };
    
    if (battle.type === 'wild') {
      battleResponse.wildPokemon = player2ActivePokemon;
    } else if (battle.Player2) {
      battleResponse.player2 = {
        id: battle.Player2.id,
        username: battle.Player2.username,
        activePokemon: player2ActivePokemon
      };
    }

    res.status(200).json(battleResponse);
  } catch (error) {
    console.error('Fehler beim Laden des Kampfes:', error);
    res.status(500).json({ message: 'Serverfehler beim Laden des Kampfes' });
  }
};

// Hilfsfunktion: Wildes Pokémon generieren
async function generateWildPokemon(pokemonBaseId) {
  // Pokémon-Grunddaten laden
  const pokemonBase = await db.PokemonBase.findByPk(pokemonBaseId);
  
  if (!pokemonBase) {
    throw new Error('Pokémon-Grunddaten nicht gefunden');
  }
  
  // Zufälliges Level zwischen 5 und 30
  const level = Math.floor(Math.random() * 26) + 5;
  
  // HP berechnen
  const maxHp = Math.floor(pokemonBase.base_hp * (level / 50 + 1));
  
  // Zufällige Attacken auswählen
  const moves = await db.Move.findAll({
    where: {
      type: [pokemonBase.primary_type, pokemonBase.secondary_type]
    },
    limit: 4
  });
  
  return {
    id: 0, // Wildes Pokémon hat keine ID
    name: pokemonBase.name,
    level: level,
    type: pokemonBase.secondary_type 
      ? `${pokemonBase.primary_type}/${pokemonBase.secondary_type}`
      : pokemonBase.primary_type,
    hp: maxHp,
    maxHp: maxHp,
    moves: moves.map(move => ({
      id: move.id,
      name: move.name,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      maxPp: move.pp
    }))
  };
}

// Hilfsfunktion: Pokémon für Kampf formatieren
function formatPokemonForBattle(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.nickname || pokemon.PokemonBase.name,
    level: pokemon.level,
    type: pokemon.PokemonBase.secondary_type 
      ? `${pokemon.PokemonBase.primary_type}/${pokemon.PokemonBase.secondary_type}`
      : pokemon.PokemonBase.primary_type,
    hp: pokemon.current_hp,
    maxHp: pokemon.max_hp,
    moves: pokemon.Moves.map(move => ({
      id: move.id,
      name: move.name,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.PokemonMove.pp_current,
      maxPp: move.PokemonMove.pp_max
    }))
  };
}
```
