# Spielstand-Speicherung für PokeTogetherBrowser - Teil 2

## Pokémon-Team-Verwaltung

Wir erweitern den Spielstand-Controller um Funktionen zur Verwaltung des Pokémon-Teams:

```javascript
// controllers/saveController.js (Fortsetzung)

// Pokémon-Team aktualisieren
exports.updatePokemonTeam = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { pokemon, action } = req.body;

    if (!pokemon) {
      return res.status(400).json({ message: 'Keine Pokémon-Daten angegeben' });
    }

    switch (action) {
      case 'reorder':
        // Pokémon im Team neu anordnen
        await reorderPokemonTeam(playerId, pokemon);
        break;
      
      case 'move_to_storage':
        // Pokémon ins Lager verschieben
        await movePokemonToStorage(playerId, pokemon.id);
        break;
      
      case 'move_to_team':
        // Pokémon ins Team verschieben
        await movePokemonToTeam(playerId, pokemon.id, pokemon.position);
        break;
      
      case 'update_stats':
        // Pokémon-Statistiken aktualisieren
        await updatePokemonStats(playerId, pokemon);
        break;
      
      case 'learn_move':
        // Neue Attacke erlernen
        await learnPokemonMove(playerId, pokemon.id, pokemon.moveId, pokemon.slot);
        break;
      
      case 'forget_move':
        // Attacke vergessen
        await forgetPokemonMove(playerId, pokemon.id, pokemon.moveId);
        break;
      
      default:
        return res.status(400).json({ message: 'Ungültige Aktion' });
    }

    // Aktualisiertes Pokémon-Team laden
    const updatedPokemon = await db.PlayerPokemon.findAll({
      where: { PlayerId: playerId },
      include: [
        db.PokemonBase,
        {
          model: db.Move,
          through: db.PokemonMove
        }
      ],
      order: [['team_position', 'ASC']]
    });

    res.status(200).json({
      message: 'Pokémon-Team erfolgreich aktualisiert',
      pokemon: updatedPokemon.map(pokemon => ({
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
      }))
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Pokémon-Teams:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Pokémon-Teams' });
  }
};

// Hilfsfunktion: Pokémon im Team neu anordnen
async function reorderPokemonTeam(playerId, pokemonOrder) {
  // Transaktion starten
  const transaction = await db.sequelize.transaction();

  try {
    for (const entry of pokemonOrder) {
      const { id, position } = entry;

      // Pokémon in der Datenbank suchen
      const pokemon = await db.PlayerPokemon.findOne({
        where: {
          id: id,
          PlayerId: playerId,
          is_in_team: true
        },
        transaction
      });

      if (pokemon) {
        // Position aktualisieren
        pokemon.team_position = position;
        await pokemon.save({ transaction });
      }
    }

    // Transaktion bestätigen
    await transaction.commit();
  } catch (error) {
    // Transaktion zurückrollen bei Fehler
    await transaction.rollback();
    throw error;
  }
}

// Hilfsfunktion: Pokémon ins Lager verschieben
async function movePokemonToStorage(playerId, pokemonId) {
  // Pokémon in der Datenbank suchen
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: pokemonId,
      PlayerId: playerId,
      is_in_team: true
    }
  });

  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden oder nicht im Team');
  }

  // Pokémon ins Lager verschieben
  pokemon.is_in_team = false;
  pokemon.team_position = null;
  await pokemon.save();

  // Team-Positionen neu ordnen
  const teamPokemon = await db.PlayerPokemon.findAll({
    where: {
      PlayerId: playerId,
      is_in_team: true
    },
    order: [['team_position', 'ASC']]
  });

  // Transaktion starten
  const transaction = await db.sequelize.transaction();

  try {
    for (let i = 0; i < teamPokemon.length; i++) {
      teamPokemon[i].team_position = i;
      await teamPokemon[i].save({ transaction });
    }

    // Transaktion bestätigen
    await transaction.commit();
  } catch (error) {
    // Transaktion zurückrollen bei Fehler
    await transaction.rollback();
    throw error;
  }
}

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
    const teamPokemon = await db.PlayerPokemon.findAll({
      where: {
        PlayerId: playerId,
        is_in_team: true,
        id: { [db.Sequelize.Op.ne]: pokemonId }
      },
      order: [['team_position', 'ASC']],
      transaction
    });

    let currentPosition = 0;
    for (const p of teamPokemon) {
      if (currentPosition === position) {
        currentPosition++;
      }
      
      p.team_position = currentPosition;
      await p.save({ transaction });
      
      currentPosition++;
    }

    // Transaktion bestätigen
    await transaction.commit();
  } catch (error) {
    // Transaktion zurückrollen bei Fehler
    await transaction.rollback();
    throw error;
  }
}

// Hilfsfunktion: Pokémon-Statistiken aktualisieren
async function updatePokemonStats(playerId, pokemonData) {
  const { id, hp, experience, level } = pokemonData;

  // Pokémon in der Datenbank suchen
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: id,
      PlayerId: playerId
    }
  });

  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden');
  }

  // Statistiken aktualisieren
  if (hp !== undefined) {
    pokemon.current_hp = hp;
  }

  if (experience !== undefined) {
    pokemon.experience = experience;
  }

  if (level !== undefined) {
    // Level-Up
    if (level > pokemon.level) {
      // Neue maximale HP berechnen
      const pokemonBase = await db.PokemonBase.findByPk(pokemon.PokemonBaseId);
      const newMaxHp = Math.floor(pokemonBase.base_hp * (level / 50 + 1));
      
      pokemon.level = level;
      pokemon.max_hp = newMaxHp;
      pokemon.current_hp = newMaxHp; // Bei Level-Up vollständig heilen
    } else {
      pokemon.level = level;
    }
  }

  await pokemon.save();
}

// Hilfsfunktion: Neue Attacke erlernen
async function learnPokemonMove(playerId, pokemonId, moveId, slot) {
  // Pokémon in der Datenbank suchen
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: pokemonId,
      PlayerId: playerId
    },
    include: [
      {
        model: db.Move,
        through: db.PokemonMove
      }
    ]
  });

  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden');
  }

  // Prüfen, ob das Pokémon bereits 4 Attacken hat
  if (pokemon.Moves.length >= 4 && slot === undefined) {
    throw new Error('Das Pokémon kennt bereits 4 Attacken');
  }

  // Prüfen, ob das Pokémon die Attacke bereits kennt
  const alreadyKnows = pokemon.Moves.some(move => move.id === moveId);
  if (alreadyKnows) {
    throw new Error('Das Pokémon kennt diese Attacke bereits');
  }

  // Attacke in der Datenbank suchen
  const move = await db.Move.findByPk(moveId);
  if (!move) {
    throw new Error('Attacke nicht gefunden');
  }

  // Wenn ein Slot angegeben wurde, die alte Attacke ersetzen
  if (slot !== undefined) {
    // Alte Attacke finden
    const oldMove = pokemon.Moves.find(move => move.PokemonMove.move_slot === slot);
    
    if (oldMove) {
      // Alte Attacke entfernen
      await db.PokemonMove.destroy({
        where: {
          PlayerPokemonId: pokemonId,
          MoveId: oldMove.id
        }
      });
    }
  } else {
    // Nächsten freien Slot finden
    slot = 0;
    while (pokemon.Moves.some(move => move.PokemonMove.move_slot === slot)) {
      slot++;
    }
  }

  // Neue Attacke hinzufügen
  await db.PokemonMove.create({
    PlayerPokemonId: pokemonId,
    MoveId: moveId,
    pp_current: move.pp,
    pp_max: move.pp,
    move_slot: slot
  });
}

// Hilfsfunktion: Attacke vergessen
async function forgetPokemonMove(playerId, pokemonId, moveId) {
  // Pokémon in der Datenbank suchen
  const pokemon = await db.PlayerPokemon.findOne({
    where: {
      id: pokemonId,
      PlayerId: playerId
    },
    include: [
      {
        model: db.Move,
        through: db.PokemonMove
      }
    ]
  });

  if (!pokemon) {
    throw new Error('Pokémon nicht gefunden');
  }

  // Prüfen, ob das Pokémon die Attacke kennt
  const knows = pokemon.Moves.some(move => move.id === moveId);
  if (!knows) {
    throw new Error('Das Pokémon kennt diese Attacke nicht');
  }

  // Attacke entfernen
  await db.PokemonMove.destroy({
    where: {
      PlayerPokemonId: pokemonId,
      MoveId: moveId
    }
  });
}
```

## Spielfortschritt-Verwaltung

Wir erweitern den Spielstand-Controller um Funktionen zur Verwaltung des Spielfortschritts:

```javascript
// controllers/saveController.js (Fortsetzung)

// Spielfortschritt aktualisieren
exports.updateProgress = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { questKey, status, data } = req.body;

    if (!questKey) {
      return res.status(400).json({ message: 'Kein Quest-Schlüssel angegeben' });
    }

    // Fortschritt in der Datenbank suchen
    let progress = await db.Progress.findOne({
      where: {
        PlayerId: playerId,
        quest_key: questKey
      }
    });

    if (progress) {
      // Fortschritt aktualisieren
      if (status) {
        progress.status = status;
        
        // Wenn die Quest abgeschlossen wurde, Zeitstempel setzen
        if (status === 'completed') {
          progress.completed_at = new Date();
        }
      }
      
      if (data) {
        progress.progress_data = data;
      }
      
      await progress.save();
    } else {
      // Neuen Fortschritt erstellen
      progress = await db.Progress.create({
        PlayerId: playerId,
        quest_key: questKey,
        status: status || 'in_progress',
        progress_data: data || {}
      });
    }

    res.status(200).json({
      message: 'Spielfortschritt erfolgreich aktualisiert',
      progress: {
        questKey: progress.quest_key,
        status: progress.status,
        data: progress.progress_data,
        completedAt: progress.completed_at
      }
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Spielfortschritts:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Spielfortschritts' });
  }
};

// Errungenschaft freischalten
exports.unlockAchievement = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { achievementKey } = req.body;

    if (!achievementKey) {
      return res.status(400).json({ message: 'Kein Errungenschaften-Schlüssel angegeben' });
    }

    // Prüfen, ob die Errungenschaft bereits freigeschaltet ist
    const existingAchievement = await db.Achievement.findOne({
      where: {
        PlayerId: playerId,
        achievement_key: achievementKey
      }
    });

    if (existingAchievement) {
      return res.status(200).json({
        message: 'Errungenschaft bereits freigeschaltet',
        achievement: {
          key: existingAchievement.achievement_key,
          unlockedAt: existingAchievement.unlocked_at
        }
      });
    }

    // Neue Errungenschaft freischalten
    const achievement = await db.Achievement.create({
      PlayerId: playerId,
      achievement_key: achievementKey,
      unlocked_at: new Date()
    });

    res.status(200).json({
      message: 'Errungenschaft erfolgreich freigeschaltet',
      achievement: {
        key: achievement.achievement_key,
        unlockedAt: achievement.unlocked_at
      }
    });
  } catch (error) {
    console.error('Fehler beim Freischalten der Errungenschaft:', error);
    res.status(500).json({ message: 'Serverfehler beim Freischalten der Errungenschaft' });
  }
};

// Geld aktualisieren
exports.updateMoney = async (req, res) => {
  try {
    const playerId = req.player.id;
    const { amount, action } = req.body;

    if (amount === undefined || !action) {
      return res.status(400).json({ message: 'Betrag oder Aktion nicht angegeben' });
    }

    // Spieler in der Datenbank suchen
    const player = await db.Player.findByPk(playerId);
    
    if (!player) {
      return res.status(404).json({ message: 'Spieler nicht gefunden' });
    }

    // Geld aktualisieren
    switch (action) {
      case 'add':
        player.money += amount;
        break;
      
      case 'subtract':
        player.money -= amount;
        
        // Geld kann nicht negativ sein
        if (player.money < 0) {
          player.money = 0;
        }
        break;
      
      case 'set':
        player.money = amount;
        break;
      
      default:
        return res.status(400).json({ message: 'Ungültige Aktion' });
    }

    await player.save();

    res.status(200).json({
      message: 'Geld erfolgreich aktualisiert',
      money: player.money
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Geldes:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Geldes' });
  }
};
```
