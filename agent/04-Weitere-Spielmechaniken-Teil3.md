# Weitere Spielmechaniken für PokeTogetherBrowser - Teil 3: Pokémon-Entwicklung

## Übersicht

In diesem Abschnitt implementieren wir das Pokémon-Entwicklungssystem, das es Pokémon ermöglicht, sich zu entwickeln, wenn sie bestimmte Bedingungen erfüllen, wie z.B. ein bestimmtes Level erreichen.

## Datenmodell-Erweiterungen

Wir erweitern das PokemonBase-Modell um Entwicklungsinformationen:

```javascript
// models/PokemonBase.js (Erweiterung)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PokemonBase = sequelize.define('PokemonBase', {
    // Bestehende Felder...
    
    // Neue Felder für Entwicklung
    evolution_level: {
      type: DataTypes.INTEGER
    },
    evolution_item_id: {
      type: DataTypes.INTEGER
    },
    evolution_condition: {
      type: DataTypes.STRING(50)
    },
    evolves_to_id: {
      type: DataTypes.INTEGER
    }
  });

  return PokemonBase;
};
```

## Entwicklungs-Controller

```javascript
// controllers/evolutionController.js
const db = require('../models');

// Pokémon entwickeln
exports.evolvePokemon = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { pokemonId } = req.body;

    // Pokémon in der Datenbank suchen
    const pokemon = await db.PlayerPokemon.findOne({
      where: {
        id: pokemonId,
        PlayerId: playerId
      },
      include: [
        {
          model: db.PokemonBase,
          include: [
            {
              model: db.PokemonBase,
              as: 'EvolvesTo'
            }
          ]
        }
      ]
    });

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokémon nicht gefunden' });
    }

    // Prüfen, ob das Pokémon sich entwickeln kann
    if (!pokemon.PokemonBase.evolves_to_id) {
      return res.status(400).json({ message: 'Dieses Pokémon kann sich nicht entwickeln' });
    }

    // Entwicklungsbedingungen prüfen
    if (pokemon.PokemonBase.evolution_level && pokemon.level < pokemon.PokemonBase.evolution_level) {
      return res.status(400).json({ message: `Dieses Pokémon kann sich erst ab Level ${pokemon.PokemonBase.evolution_level} entwickeln` });
    }

    if (pokemon.PokemonBase.evolution_item_id) {
      // Prüfen, ob der Spieler das benötigte Item besitzt
      const evolutionItem = await db.InventoryItem.findOne({
        where: {
          PlayerId: playerId,
          ItemId: pokemon.PokemonBase.evolution_item_id,
          quantity: { [db.Sequelize.Op.gt]: 0 }
        }
      });

      if (!evolutionItem) {
        return res.status(400).json({ message: 'Du besitzt nicht das benötigte Item für die Entwicklung' });
      }

      // Item verbrauchen
      evolutionItem.quantity -= 1;
      if (evolutionItem.quantity <= 0) {
        await evolutionItem.destroy();
      } else {
        await evolutionItem.save();
      }
    }

    // Entwicklungsziel laden
    const evolutionTarget = await db.PokemonBase.findByPk(pokemon.PokemonBase.evolves_to_id);
    if (!evolutionTarget) {
      return res.status(500).json({ message: 'Entwicklungsziel nicht gefunden' });
    }

    // Alte Werte speichern
    const oldName = pokemon.PokemonBase.name;
    const oldType = pokemon.PokemonBase.secondary_type 
      ? `${pokemon.PokemonBase.primary_type}/${pokemon.PokemonBase.secondary_type}`
      : pokemon.PokemonBase.primary_type;

    // Pokémon entwickeln
    pokemon.PokemonBaseId = evolutionTarget.id;

    // Neue HP berechnen
    const oldMaxHp = pokemon.max_hp;
    const newMaxHp = Math.floor(evolutionTarget.base_hp * (pokemon.level / 50 + 1));
    const hpDifference = newMaxHp - oldMaxHp;

    pokemon.max_hp = newMaxHp;
    pokemon.current_hp += hpDifference;
    if (pokemon.current_hp > pokemon.max_hp) {
      pokemon.current_hp = pokemon.max_hp;
    }

    await pokemon.save();

    // Neues Pokémon mit allen Daten laden
    const evolvedPokemon = await db.PlayerPokemon.findByPk(pokemon.id, {
      include: [
        db.PokemonBase,
        {
          model: db.Move,
          through: db.PokemonMove
        }
      ]
    });

    // Neue Attacken lernen
    const newMoves = await learnEvolutionMoves(evolvedPokemon);

    res.status(200).json({
      message: `Glückwunsch! Dein ${oldName} hat sich zu ${evolutionTarget.name} entwickelt!`,
      pokemon: {
        id: evolvedPokemon.id,
        name: evolvedPokemon.nickname || evolvedPokemon.PokemonBase.name,
        level: evolvedPokemon.level,
        oldType: oldType,
        newType: evolvedPokemon.PokemonBase.secondary_type 
          ? `${evolvedPokemon.PokemonBase.primary_type}/${evolvedPokemon.PokemonBase.secondary_type}`
          : evolvedPokemon.PokemonBase.primary_type,
        hp: evolvedPokemon.current_hp,
        maxHp: evolvedPokemon.max_hp,
        newMoves: newMoves
      }
    });
  } catch (error) {
    console.error('Fehler bei der Pokémon-Entwicklung:', error);
    res.status(500).json({ message: 'Serverfehler bei der Pokémon-Entwicklung' });
  }
};

// Hilfsfunktion: Neue Attacken nach der Entwicklung lernen
async function learnEvolutionMoves(pokemon) {
  try {
    // Neue Attacken für die Entwicklungsstufe laden
    const evolutionMoves = await db.EvolutionMove.findAll({
      where: {
        PokemonBaseId: pokemon.PokemonBaseId
      },
      include: [db.Move]
    });

    if (evolutionMoves.length === 0) {
      return [];
    }

    // Aktuelle Attacken des Pokémon laden
    const currentMoves = pokemon.Moves.map(move => move.id);
    const newMoves = [];

    // Für jede neue Attacke
    for (const evolutionMove of evolutionMoves) {
      // Prüfen, ob das Pokémon die Attacke bereits kennt
      if (currentMoves.includes(evolutionMove.Move.id)) {
        continue;
      }

      // Prüfen, ob das Pokémon bereits 4 Attacken hat
      if (currentMoves.length >= 4) {
        // Keine weiteren Attacken lernen
        break;
      }

      // Neue Attacke lernen
      await db.PokemonMove.create({
        PlayerPokemonId: pokemon.id,
        MoveId: evolutionMove.Move.id,
        pp_current: evolutionMove.Move.pp,
        pp_max: evolutionMove.Move.pp,
        move_slot: currentMoves.length
      });

      // Attacke zur Liste der neuen Attacken hinzufügen
      newMoves.push({
        id: evolutionMove.Move.id,
        name: evolutionMove.Move.name,
        type: evolutionMove.Move.type,
        power: evolutionMove.Move.power,
        accuracy: evolutionMove.Move.accuracy,
        pp: evolutionMove.Move.pp
      });

      // Attacke zur Liste der aktuellen Attacken hinzufügen
      currentMoves.push(evolutionMove.Move.id);
    }

    return newMoves;
  } catch (error) {
    console.error('Fehler beim Lernen neuer Attacken:', error);
    throw error;
  }
}

// Prüfen, ob ein Pokémon sich entwickeln kann
exports.checkEvolution = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { pokemonId } = req.params;

    // Pokémon in der Datenbank suchen
    const pokemon = await db.PlayerPokemon.findOne({
      where: {
        id: pokemonId,
        PlayerId: playerId
      },
      include: [
        {
          model: db.PokemonBase,
          include: [
            {
              model: db.PokemonBase,
              as: 'EvolvesTo'
            }
          ]
        }
      ]
    });

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokémon nicht gefunden' });
    }

    // Prüfen, ob das Pokémon sich entwickeln kann
    if (!pokemon.PokemonBase.evolves_to_id) {
      return res.status(200).json({
        canEvolve: false,
        message: 'Dieses Pokémon kann sich nicht entwickeln'
      });
    }

    // Entwicklungsbedingungen prüfen
    let canEvolve = true;
    let requirements = [];

    if (pokemon.PokemonBase.evolution_level) {
      if (pokemon.level < pokemon.PokemonBase.evolution_level) {
        canEvolve = false;
        requirements.push({
          type: 'level',
          current: pokemon.level,
          required: pokemon.PokemonBase.evolution_level
        });
      }
    }

    if (pokemon.PokemonBase.evolution_item_id) {
      // Prüfen, ob der Spieler das benötigte Item besitzt
      const evolutionItem = await db.InventoryItem.findOne({
        where: {
          PlayerId: playerId,
          ItemId: pokemon.PokemonBase.evolution_item_id
        },
        include: [db.Item]
      });

      if (!evolutionItem || evolutionItem.quantity <= 0) {
        canEvolve = false;
        
        // Item-Informationen laden
        const item = evolutionItem 
          ? evolutionItem.Item 
          : await db.Item.findByPk(pokemon.PokemonBase.evolution_item_id);
        
        requirements.push({
          type: 'item',
          itemId: pokemon.PokemonBase.evolution_item_id,
          itemName: item ? item.name : 'Unbekanntes Item',
          current: evolutionItem ? evolutionItem.quantity : 0,
          required: 1
        });
      }
    }

    if (pokemon.PokemonBase.evolution_condition) {
      // Spezielle Bedingungen prüfen (z.B. Tageszeit, Freundschaft, etc.)
      // Hier vereinfacht implementiert
      const conditionMet = checkSpecialCondition(pokemon.PokemonBase.evolution_condition);
      
      if (!conditionMet) {
        canEvolve = false;
        requirements.push({
          type: 'condition',
          condition: pokemon.PokemonBase.evolution_condition,
          message: getConditionMessage(pokemon.PokemonBase.evolution_condition)
        });
      }
    }

    res.status(200).json({
      canEvolve: canEvolve,
      pokemon: {
        id: pokemon.id,
        name: pokemon.nickname || pokemon.PokemonBase.name,
        level: pokemon.level,
        type: pokemon.PokemonBase.secondary_type 
          ? `${pokemon.PokemonBase.primary_type}/${pokemon.PokemonBase.secondary_type}`
          : pokemon.PokemonBase.primary_type
      },
      evolution: pokemon.PokemonBase.EvolvesTo ? {
        id: pokemon.PokemonBase.EvolvesTo.id,
        name: pokemon.PokemonBase.EvolvesTo.name,
        type: pokemon.PokemonBase.EvolvesTo.secondary_type 
          ? `${pokemon.PokemonBase.EvolvesTo.primary_type}/${pokemon.PokemonBase.EvolvesTo.secondary_type}`
          : pokemon.PokemonBase.EvolvesTo.primary_type
      } : null,
      requirements: requirements
    });
  } catch (error) {
    console.error('Fehler beim Prüfen der Entwicklungsmöglichkeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Prüfen der Entwicklungsmöglichkeiten' });
  }
};

// Hilfsfunktion: Spezielle Entwicklungsbedingungen prüfen
function checkSpecialCondition(condition) {
  // Hier würden spezielle Bedingungen geprüft werden
  // Für die Einfachheit geben wir immer true zurück
  return true;
}

// Hilfsfunktion: Nachricht für spezielle Entwicklungsbedingungen
function getConditionMessage(condition) {
  switch (condition) {
    case 'friendship':
      return 'Hohe Freundschaft erforderlich';
    case 'daytime':
      return 'Entwicklung nur tagsüber möglich';
    case 'nighttime':
      return 'Entwicklung nur nachts möglich';
    case 'trade':
      return 'Entwicklung nur durch Tausch möglich';
    default:
      return `Spezielle Bedingung erforderlich: ${condition}`;
  }
}
```

## Erfahrungspunkte und Level-Up

```javascript
// controllers/experienceController.js
const db = require('../models');

// Erfahrungspunkte hinzufügen
exports.addExperience = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { pokemonId, amount } = req.body;

    if (!pokemonId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Ungültige Anfrage' });
    }

    // Pokémon in der Datenbank suchen
    const pokemon = await db.PlayerPokemon.findOne({
      where: {
        id: pokemonId,
        PlayerId: playerId
      },
      include: [db.PokemonBase]
    });

    if (!pokemon) {
      return res.status(404).json({ message: 'Pokémon nicht gefunden' });
    }

    // Erfahrungspunkte hinzufügen
    const result = await addExperienceToPlayerPokemon(pokemon, amount);

    res.status(200).json({
      message: `${pokemon.nickname || pokemon.PokemonBase.name} hat ${amount} Erfahrungspunkte erhalten!`,
      pokemon: {
        id: pokemon.id,
        name: pokemon.nickname || pokemon.PokemonBase.name,
        level: result.newLevel,
        experience: result.newExperience,
        nextLevelExperience: calculateExperienceForLevel(result.newLevel + 1),
        levelUp: result.levelUp,
        newMoves: result.newMoves
      }
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen von Erfahrungspunkten:', error);
    res.status(500).json({ message: 'Serverfehler beim Hinzufügen von Erfahrungspunkten' });
  }
};

// Hilfsfunktion: Erfahrungspunkte zu einem Pokémon hinzufügen
async function addExperienceToPlayerPokemon(pokemon, amount) {
  try {
    // Aktuelle Werte speichern
    const oldLevel = pokemon.level;
    const oldExperience = pokemon.experience;
    
    // Erfahrungspunkte hinzufügen
    pokemon.experience += amount;
    
    // Neues Level berechnen
    let newLevel = oldLevel;
    let levelUp = false;
    let newMoves = [];
    
    // Prüfen, ob ein Level-Up stattgefunden hat
    while (pokemon.experience >= calculateExperienceForLevel(newLevel + 1)) {
      newLevel++;
      levelUp = true;
      
      // Neue Attacken beim Level-Up lernen
      const levelMoves = await db.LevelMove.findAll({
        where: {
          PokemonBaseId: pokemon.PokemonBaseId,
          level: newLevel
        },
        include: [db.Move]
      });
      
      for (const levelMove of levelMoves) {
        const move = await learnMoveIfPossible(pokemon, levelMove.Move);
        if (move) {
          newMoves.push(move);
        }
      }
    }
    
    // Pokémon aktualisieren, wenn ein Level-Up stattgefunden hat
    if (levelUp) {
      pokemon.level = newLevel;
      
      // Neue HP berechnen
      const oldMaxHp = pokemon.max_hp;
      const newMaxHp = Math.floor(pokemon.PokemonBase.base_hp * (newLevel / 50 + 1));
      const hpDifference = newMaxHp - oldMaxHp;
      
      pokemon.max_hp = newMaxHp;
      pokemon.current_hp += hpDifference;
      if (pokemon.current_hp > pokemon.max_hp) {
        pokemon.current_hp = pokemon.max_hp;
      }
    }
    
    await pokemon.save();
    
    return {
      oldLevel,
      newLevel,
      oldExperience,
      newExperience: pokemon.experience,
      levelUp,
      newMoves
    };
  } catch (error) {
    console.error('Fehler beim Hinzufügen von Erfahrungspunkten:', error);
    throw error;
  }
}

// Hilfsfunktion: Attacke lernen, wenn möglich
async function learnMoveIfPossible(pokemon, move) {
  try {
    // Prüfen, ob das Pokémon die Attacke bereits kennt
    const alreadyKnows = await db.PokemonMove.findOne({
      where: {
        PlayerPokemonId: pokemon.id,
        MoveId: move.id
      }
    });
    
    if (alreadyKnows) {
      return null;
    }
    
    // Anzahl der aktuellen Attacken zählen
    const moveCount = await db.PokemonMove.count({
      where: {
        PlayerPokemonId: pokemon.id
      }
    });
    
    // Wenn das Pokémon bereits 4 Attacken hat, kann es keine neue lernen
    if (moveCount >= 4) {
      return {
        id: move.id,
        name: move.name,
        type: move.type,
        power: move.power,
        accuracy: move.accuracy,
        pp: move.pp,
        canLearn: false
      };
    }
    
    // Neue Attacke lernen
    await db.PokemonMove.create({
      PlayerPokemonId: pokemon.id,
      MoveId: move.id,
      pp_current: move.pp,
      pp_max: move.pp,
      move_slot: moveCount
    });
    
    return {
      id: move.id,
      name: move.name,
      type: move.type,
      power: move.power,
      accuracy: move.accuracy,
      pp: move.pp,
      canLearn: true
    };
  } catch (error) {
    console.error('Fehler beim Lernen einer Attacke:', error);
    throw error;
  }
}

// Hilfsfunktion: Erfahrungspunkte für ein Level berechnen
function calculateExperienceForLevel(level) {
  // Einfache Formel: level^3
  return Math.floor(Math.pow(level, 3));
}

// Hilfsfunktion: Erfahrungsgewinn im Kampf berechnen
function calculateExperienceGain(winnerPokemon, defeatedPokemon) {
  // Basisformel: (Besiegtes Pokémon Level * Basisertrag) / 7
  const baseYield = 50; // Basisertrag für besiegte Pokémon
  const level = defeatedPokemon.level || 5;
  
  let exp = Math.floor((level * baseYield) / 7);
  
  // Bonus für Trainer-Pokémon
  if (defeatedPokemon.isTrainerPokemon) {
    exp = Math.floor(exp * 1.5);
  }
  
  return exp;
}
```
