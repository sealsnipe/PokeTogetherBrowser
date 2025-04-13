# Weitere Spielmechaniken für PokeTogetherBrowser - Teil 2: Kampflogik

## Kampflogik-Implementierung

Hier implementieren wir die Kernfunktionen des Kampfsystems, die für die Ausführung von Kampfaktionen verantwortlich sind:

```javascript
// controllers/battleController.js (Fortsetzung)

// Hilfsfunktion: Angriff ausführen
async function performAttack(battle, playerId, moveId, targetPosition) {
  // Bestimmen, ob der Spieler Spieler 1 oder Spieler 2 ist
  const isPlayer1 = battle.player1_id === playerId;
  
  // Aktives Pokémon des Angreifers laden
  const attackerPokemonId = isPlayer1 ? battle.player1_active_pokemon : battle.player2_active_pokemon;
  let attackerPokemon;
  
  if (isPlayer1 || battle.type === 'player') {
    // Spieler-Pokémon laden
    attackerPokemon = await db.PlayerPokemon.findByPk(attackerPokemonId, {
      include: [
        db.PokemonBase,
        {
          model: db.Move,
          through: db.PokemonMove,
          where: { id: moveId }
        }
      ]
    });
  } else {
    // Wildes Pokémon
    attackerPokemon = {
      ...battle.battle_data.wildPokemon,
      Moves: battle.battle_data.wildPokemon.moves.filter(move => move.id === moveId)
    };
  }
  
  if (!attackerPokemon || attackerPokemon.Moves.length === 0) {
    throw new Error('Pokémon oder Attacke nicht gefunden');
  }
  
  // Attacke abrufen
  const move = attackerPokemon.Moves[0];
  
  // Ziel-Pokémon laden
  const defenderPokemonId = isPlayer1 ? battle.player2_active_pokemon : battle.player1_active_pokemon;
  let defenderPokemon;
  
  if (!isPlayer1 || battle.type === 'player') {
    // Spieler-Pokémon laden
    defenderPokemon = await db.PlayerPokemon.findByPk(defenderPokemonId, {
      include: [db.PokemonBase]
    });
    
    if (defenderPokemon) {
      defenderPokemon = formatPokemonForBattle(defenderPokemon);
    }
  } else {
    // Wildes Pokémon
    defenderPokemon = battle.battle_data.wildPokemon;
  }
  
  if (!defenderPokemon) {
    throw new Error('Ziel-Pokémon nicht gefunden');
  }
  
  // PP reduzieren
  if (isPlayer1 || battle.type === 'player') {
    const pokemonMove = await db.PokemonMove.findOne({
      where: {
        PlayerPokemonId: attackerPokemonId,
        MoveId: moveId
      }
    });
    
    if (pokemonMove) {
      pokemonMove.pp_current -= 1;
      await pokemonMove.save();
      
      // Aktualisierte PP für die Antwort
      move.pp = pokemonMove.pp_current;
    }
  } else {
    // PP für wildes Pokémon reduzieren
    const moveIndex = battle.battle_data.wildPokemon.moves.findIndex(m => m.id === moveId);
    if (moveIndex !== -1) {
      battle.battle_data.wildPokemon.moves[moveIndex].pp -= 1;
      await battle.save();
      
      // Aktualisierte PP für die Antwort
      move.pp = battle.battle_data.wildPokemon.moves[moveIndex].pp;
    }
  }
  
  // Trefferchance berechnen
  const hitChance = move.accuracy / 100;
  const hit = Math.random() <= hitChance;
  
  if (!hit) {
    return {
      success: false,
      message: `${attackerPokemon.nickname || attackerPokemon.name} verfehlt mit ${move.name}!`,
      nextTurn: true
    };
  }
  
  // Schaden berechnen
  let damage = 0;
  
  if (move.power) {
    // Angriffswert des Angreifers
    const attackStat = move.category === 'physical' 
      ? (attackerPokemon.PokemonBase?.base_attack || 50) 
      : (attackerPokemon.PokemonBase?.base_special_attack || 50);
    
    // Verteidigungswert des Verteidigers
    const defenseStat = move.category === 'physical' 
      ? (defenderPokemon.PokemonBase?.base_defense || 50) 
      : (defenderPokemon.PokemonBase?.base_special_defense || 50);
    
    // Grundformel für Schaden
    damage = Math.floor(
      ((2 * attackerPokemon.level / 5 + 2) * move.power * attackStat / defenseStat / 50 + 2)
    );
    
    // Typ-Effektivität berechnen
    const typeEffectiveness = calculateTypeEffectiveness(move.type, defenderPokemon.type);
    damage = Math.floor(damage * typeEffectiveness);
    
    // Zufallsfaktor (85-100%)
    const randomFactor = (Math.random() * 15 + 85) / 100;
    damage = Math.floor(damage * randomFactor);
    
    // STAB (Same Type Attack Bonus)
    if (attackerPokemon.type.includes(move.type)) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Kritischer Treffer (6.25% Chance)
    const isCritical = Math.random() < 0.0625;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Schaden anwenden
    defenderPokemon.hp -= damage;
    if (defenderPokemon.hp < 0) defenderPokemon.hp = 0;
    
    // Pokémon in der Datenbank aktualisieren
    if (isPlayer1 && battle.type === 'wild') {
      // Wildes Pokémon aktualisieren
      battle.battle_data.wildPokemon.hp = defenderPokemon.hp;
      await battle.save();
    } else if (!isPlayer1 && battle.type === 'wild') {
      // Spieler-Pokémon aktualisieren
      const playerPokemon = await db.PlayerPokemon.findByPk(defenderPokemonId);
      if (playerPokemon) {
        playerPokemon.current_hp = defenderPokemon.hp;
        await playerPokemon.save();
      }
    } else {
      // Spieler-Pokémon in einem Spieler-Kampf aktualisieren
      const playerPokemon = await db.PlayerPokemon.findByPk(defenderPokemonId);
      if (playerPokemon) {
        playerPokemon.current_hp = defenderPokemon.hp;
        await playerPokemon.save();
      }
    }
  }
  
  // Ergebnis vorbereiten
  const result = {
    success: true,
    move: {
      id: move.id,
      name: move.name,
      type: move.type,
      pp: move.pp
    },
    damage: damage,
    defenderHp: defenderPokemon.hp,
    message: `${attackerPokemon.nickname || attackerPokemon.name} setzt ${move.name} ein!`
  };
  
  // Prüfen, ob das Ziel-Pokémon besiegt wurde
  if (defenderPokemon.hp <= 0) {
    result.defeated = true;
    result.message += ` ${defenderPokemon.nickname || defenderPokemon.name} wurde besiegt!`;
    
    // Prüfen, ob der Kampf beendet ist
    if (battle.type === 'wild') {
      // Wildes Pokémon besiegt
      result.battleEnded = true;
      result.battleResult = isPlayer1 ? 'player1_won' : 'player2_won';
      
      // Erfahrungspunkte und Belohnungen
      if (isPlayer1) {
        const expGained = calculateExperienceGain(attackerPokemon, defenderPokemon);
        result.expGained = expGained;
        
        // Erfahrungspunkte dem Pokémon hinzufügen
        await addExperienceToPlayerPokemon(attackerPokemonId, expGained);
      }
    } else {
      // Prüfen, ob der Spieler noch weitere Pokémon hat
      const remainingPokemon = await db.PlayerPokemon.count({
        where: {
          PlayerId: isPlayer1 ? battle.player2_id : battle.player1_id,
          is_in_team: true,
          current_hp: { [db.Sequelize.Op.gt]: 0 }
        }
      });
      
      if (remainingPokemon === 0) {
        // Kein weiteres kampffähiges Pokémon
        result.battleEnded = true;
        result.battleResult = isPlayer1 ? 'player1_won' : 'player2_won';
        
        // Belohnungen für den Gewinner
        const reward = calculateBattleReward(battle);
        result.reward = reward;
        
        // Belohnung dem Gewinner gutschreiben
        await addRewardToPlayer(isPlayer1 ? battle.player1_id : battle.player2_id, reward);
      } else {
        // Nächstes Pokémon muss ausgewählt werden
        result.needsSwitch = true;
        result.nextTurn = false;
      }
    }
  } else {
    // Kampf geht weiter
    result.nextTurn = true;
  }
  
  return result;
}

// Hilfsfunktion: Pokémon wechseln
async function switchPokemon(battle, playerId, pokemonId) {
  // Bestimmen, ob der Spieler Spieler 1 oder Spieler 2 ist
  const isPlayer1 = battle.player1_id === playerId;
  
  // Prüfen, ob das Pokémon dem Spieler gehört und im Team ist
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: pokemonId,
      PlayerId: playerId,
      is_in_team: true
    },
    include: [db.PokemonBase]
  });
  
  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden oder nicht im Team');
  }
  
  // Prüfen, ob das Pokémon kampffähig ist
  if (pokemon.current_hp <= 0) {
    throw new Error('Dieses Pokémon ist nicht kampffähig');
  }
  
  // Aktives Pokémon aktualisieren
  if (isPlayer1) {
    battle.player1_active_pokemon = pokemonId;
  } else {
    battle.player2_active_pokemon = pokemonId;
  }
  
  await battle.save();
  
  // Ergebnis vorbereiten
  return {
    success: true,
    pokemon: formatPokemonForBattle(pokemon),
    message: `${pokemon.nickname || pokemon.PokemonBase.name} wurde in den Kampf geschickt!`,
    nextTurn: true,
    player1ActivePokemon: isPlayer1 ? pokemonId : undefined,
    player2ActivePokemon: !isPlayer1 ? pokemonId : undefined
  };
}

// Hilfsfunktion: Item verwenden
async function useItem(battle, playerId, itemId, targetPosition) {
  // Bestimmen, ob der Spieler Spieler 1 oder Spieler 2 ist
  const isPlayer1 = battle.player1_id === playerId;
  
  // Item in der Datenbank suchen
  const inventoryItem = await db.InventoryItem.findOne({
    where: {
      PlayerId: playerId,
      ItemId: itemId
    },
    include: [db.Item]
  });
  
  if (!inventoryItem || inventoryItem.quantity <= 0) {
    throw new Error('Item nicht im Inventar');
  }
  
  // Ziel-Pokémon laden
  let targetPokemon;
  
  if (targetPosition === 'active') {
    // Aktives Pokémon als Ziel
    const targetPokemonId = isPlayer1 ? battle.player1_active_pokemon : battle.player2_active_pokemon;
    targetPokemon = await db.PlayerPokemon.findByPk(targetPokemonId, {
      include: [db.PokemonBase]
    });
  } else {
    // Pokémon im Team als Ziel
    targetPokemon = await db.PlayerPokemon.findOne({
      where: {
        PlayerId: playerId,
        is_in_team: true,
        team_position: targetPosition
      },
      include: [db.PokemonBase]
    });
  }
  
  if (!targetPokemon) {
    throw new Error('Ziel-Pokémon nicht gefunden');
  }
  
  // Item-Effekt anwenden
  let itemEffect = {};
  
  switch (inventoryItem.Item.type) {
    case 'medicine':
      // Heilitem
      const healAmount = getHealAmount(inventoryItem.Item.name);
      const oldHp = targetPokemon.current_hp;
      
      targetPokemon.current_hp += healAmount;
      if (targetPokemon.current_hp > targetPokemon.max_hp) {
        targetPokemon.current_hp = targetPokemon.max_hp;
      }
      
      await targetPokemon.save();
      
      itemEffect = {
        type: 'heal',
        amount: targetPokemon.current_hp - oldHp,
        newHp: targetPokemon.current_hp
      };
      break;
    
    case 'ball':
      // Pokéball (nur bei wilden Pokémon)
      if (battle.type !== 'wild' || isPlayer1 === false) {
        throw new Error('Pokébälle können nur gegen wilde Pokémon eingesetzt werden');
      }
      
      const catchResult = attemptCatch(battle.battle_data.wildPokemon, inventoryItem.Item.name);
      
      if (catchResult.success) {
        // Pokémon gefangen
        await catchWildPokemon(playerId, battle.battle_data.wildPokemon);
        
        itemEffect = {
          type: 'catch',
          success: true,
          pokemon: battle.battle_data.wildPokemon
        };
        
        // Kampf beenden
        battle.status = 'player1_won';
        battle.ended_at = new Date();
        await battle.save();
      } else {
        itemEffect = {
          type: 'catch',
          success: false,
          shakes: catchResult.shakes
        };
      }
      break;
    
    default:
      throw new Error('Dieser Item-Typ kann im Kampf nicht verwendet werden');
  }
  
  // Item aus dem Inventar entfernen
  inventoryItem.quantity -= 1;
  if (inventoryItem.quantity <= 0) {
    await inventoryItem.destroy();
  } else {
    await inventoryItem.save();
  }
  
  // Ergebnis vorbereiten
  const result = {
    success: true,
    item: {
      id: inventoryItem.Item.id,
      name: inventoryItem.Item.name,
      type: inventoryItem.Item.type
    },
    target: {
      id: targetPokemon.id,
      name: targetPokemon.nickname || targetPokemon.PokemonBase.name
    },
    effect: itemEffect,
    message: `${inventoryItem.Item.name} wurde auf ${targetPokemon.nickname || targetPokemon.PokemonBase.name} angewendet!`
  };
  
  // Prüfen, ob der Kampf beendet ist
  if (itemEffect.type === 'catch' && itemEffect.success) {
    result.battleEnded = true;
    result.battleResult = 'player1_won';
    result.message = `${battle.battle_data.wildPokemon.name} wurde gefangen!`;
  } else {
    result.nextTurn = true;
  }
  
  return result;
}

// Hilfsfunktion: Fluchtversuch
async function attemptFlee(battle, playerId) {
  // Flucht ist nur gegen wilde Pokémon möglich
  if (battle.type !== 'wild') {
    throw new Error('Flucht ist nur gegen wilde Pokémon möglich');
  }
  
  // Bestimmen, ob der Spieler Spieler 1 oder Spieler 2 ist
  const isPlayer1 = battle.player1_id === playerId;
  
  // Fluchtchance berechnen (immer erfolgreich für Einfachheit)
  const fleeSuccess = true;
  
  if (fleeSuccess) {
    // Kampf beenden
    battle.status = 'fled';
    battle.ended_at = new Date();
    await battle.save();
    
    return {
      success: true,
      message: 'Flucht erfolgreich!',
      battleEnded: true,
      battleResult: 'fled'
    };
  } else {
    return {
      success: false,
      message: 'Flucht fehlgeschlagen!',
      nextTurn: true
    };
  }
}
```

## Typ-Effektivität

Die Typ-Effektivität ist ein wichtiger Bestandteil des Kampfsystems. Hier implementieren wir die Funktion zur Berechnung der Typ-Effektivität:

```javascript
// utils/battleUtils.js

// Typ-Effektivitätstabelle
const typeEffectivenessChart = {
  Normal: {
    Fighting: 2,
    Ghost: 0
  },
  Fire: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Ice: 0.5,
    Ground: 2,
    Bug: 0.5,
    Rock: 2,
    Steel: 0.5
  },
  Water: {
    Fire: 0.5,
    Water: 0.5,
    Grass: 2,
    Electric: 2,
    Ice: 0.5,
    Steel: 0.5
  },
  Electric: {
    Water: 0.5,
    Electric: 0.5,
    Grass: 0.5,
    Ground: 2,
    Flying: 0.5
  },
  Grass: {
    Fire: 2,
    Water: 0.5,
    Grass: 0.5,
    Poison: 2,
    Ground: 0.5,
    Flying: 2,
    Bug: 2,
    Rock: 0.5,
    Steel: 2
  },
  Ice: {
    Fire: 2,
    Water: 0.5,
    Grass: 0.5,
    Ice: 0.5,
    Fighting: 2,
    Rock: 2,
    Steel: 2
  },
  Fighting: {
    Normal: 0.5,
    Ice: 0.5,
    Poison: 2,
    Flying: 2,
    Psychic: 2,
    Bug: 0.5,
    Rock: 0.5,
    Ghost: 2,
    Dark: 0.5,
    Steel: 0.5,
    Fairy: 2
  },
  Poison: {
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Psychic: 2,
    Bug: 0.5,
    Fairy: 0.5
  },
  Ground: {
    Fire: 0.5,
    Electric: 0,
    Grass: 2,
    Poison: 0.5,
    Flying: 0,
    Bug: 0.5,
    Rock: 0.5
  },
  Flying: {
    Electric: 2,
    Grass: 0.5,
    Fighting: 0.5,
    Bug: 0.5,
    Rock: 2,
    Steel: 2
  },
  Psychic: {
    Fighting: 0.5,
    Poison: 0.5,
    Psychic: 0.5,
    Dark: 2,
    Steel: 2
  },
  Bug: {
    Fire: 2,
    Grass: 0.5,
    Fighting: 0.5,
    Poison: 2,
    Flying: 2,
    Psychic: 0.5,
    Ghost: 2,
    Dark: 0.5,
    Steel: 2
  },
  Rock: {
    Fire: 0.5,
    Ice: 0.5,
    Fighting: 2,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Steel: 2
  },
  Ghost: {
    Normal: 0,
    Psychic: 0.5,
    Ghost: 2,
    Dark: 2
  },
  Dragon: {
    Dragon: 2,
    Steel: 2,
    Fairy: 2
  },
  Dark: {
    Fighting: 2,
    Psychic: 0,
    Ghost: 0.5,
    Dark: 0.5,
    Fairy: 2
  },
  Steel: {
    Fire: 2,
    Water: 2,
    Electric: 2,
    Ice: 0.5,
    Rock: 0.5,
    Steel: 0.5,
    Fairy: 0.5
  },
  Fairy: {
    Fighting: 0.5,
    Poison: 2,
    Bug: 0.5,
    Dragon: 0,
    Dark: 0.5,
    Steel: 2
  }
};

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

// Hilfsfunktion: Typnamen übersetzen
function translateTypeToEnglish(germanType) {
  const typeTranslation = {
    'Normal': 'Normal',
    'Feuer': 'Fire',
    'Wasser': 'Water',
    'Elektro': 'Electric',
    'Pflanze': 'Grass',
    'Eis': 'Ice',
    'Kampf': 'Fighting',
    'Gift': 'Poison',
    'Boden': 'Ground',
    'Flug': 'Flying',
    'Psycho': 'Psychic',
    'Käfer': 'Bug',
    'Gestein': 'Rock',
    'Geist': 'Ghost',
    'Drache': 'Dragon',
    'Unlicht': 'Dark',
    'Stahl': 'Steel',
    'Fee': 'Fairy'
  };
  
  return typeTranslation[germanType] || germanType;
}

module.exports = {
  calculateTypeEffectiveness
};
```
