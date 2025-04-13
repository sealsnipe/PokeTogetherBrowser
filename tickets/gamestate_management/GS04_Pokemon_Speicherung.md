# Ticket GS04: Pokémon-Speicherung (Controller & Route)

**Ziel:** Implementierung der serverseitigen Logik zur Verwaltung des Pokémon-Teams und -Lagers des Spielers über eine API-Route. Anpassung der `loadGame`-Funktion, um die Pokémon-Daten mitzuladen.

**Hintergrund & Logik:**
Die Verwaltung der Pokémon eines Spielers (Team-Zusammenstellung, Lagerung, Erlernen/Vergessen von Attacken, Aktualisieren von Statuswerten nach Kämpfen oder Level-Ups) ist ein Kernbestandteil des Spiels. Ähnlich wie beim Inventar benötigen wir eine dedizierte Controller-Funktion (`updatePokemonTeam`), die verschiedene Aktionen zur Manipulation der Pokémon-Daten in der Datenbank (`PlayerPokemon`, `PokemonMove`) durchführt. Diese Funktion sollte ebenfalls Transaktionen verwenden, wo mehrere zusammenhängende Änderungen notwendig sind (z.B. beim Verschieben zwischen Team und Lager). Die `loadGame`-Funktion muss erweitert werden, um alle relevanten Pokémon-Daten (inkl. Basisdaten und erlernter Attacken) abzurufen.

**Arbeitsschritte:**

1.  **`updatePokemonTeam`-Funktion implementieren (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Füge die folgende Funktion hinzu (inkl. der benötigten Hilfsfunktionen):
        ```javascript
        // Pokémon-Team/Lager aktualisieren
        exports.updatePokemonTeam = async (req, res) => {
          try {
            const playerId = req.player.id;
            // Erwartet ein Objekt mit 'action' und relevanten 'pokemon'-Daten
            // Beispiele:
            // { action: 'reorder', pokemon: [{ id: 1, position: 0 }, { id: 5, position: 1 }] }
            // { action: 'move_to_storage', pokemon: { id: 1 } }
            // { action: 'move_to_team', pokemon: { id: 10, position: 2 } }
            // { action: 'update_stats', pokemon: { id: 1, hp: 50, experience: 1250, level: 6 } }
            // { action: 'learn_move', pokemon: { id: 1, moveId: 15, slot: 0 } } // slot optional
            // { action: 'forget_move', pokemon: { id: 1, moveId: 10 } }
            const { pokemon, action } = req.body;

            if (!action || !pokemon) {
              return res.status(400).json({ message: 'Aktion oder Pokémon-Daten fehlen.' });
            }

            // Aktion ausführen (Hilfsfunktionen werden unten definiert)
            switch (action) {
              case 'reorder':
                if (!Array.isArray(pokemon)) return res.status(400).json({ message: 'Ungültiges Format für Pokémon-Reihenfolge.' });
                await reorderPokemonTeam(playerId, pokemon);
                break;
              case 'move_to_storage':
                if (typeof pokemon.id !== 'number') return res.status(400).json({ message: 'Ungültige Pokémon-ID.' });
                await movePokemonToStorage(playerId, pokemon.id);
                break;
              case 'move_to_team':
                 if (typeof pokemon.id !== 'number' || (pokemon.position !== undefined && typeof pokemon.position !== 'number')) {
                    return res.status(400).json({ message: 'Ungültige Pokémon-ID oder Position.' });
                 }
                await movePokemonToTeam(playerId, pokemon.id, pokemon.position);
                break;
              case 'update_stats':
                if (typeof pokemon.id !== 'number') return res.status(400).json({ message: 'Ungültige Pokémon-ID.' });
                await updatePokemonStats(playerId, pokemon);
                break;
              case 'learn_move':
                 if (typeof pokemon.id !== 'number' || typeof pokemon.moveId !== 'number' || (pokemon.slot !== undefined && typeof pokemon.slot !== 'number')) {
                    return res.status(400).json({ message: 'Ungültige Pokémon-ID, Move-ID oder Slot.' });
                 }
                await learnPokemonMove(playerId, pokemon.id, pokemon.moveId, pokemon.slot);
                break;
              case 'forget_move':
                 if (typeof pokemon.id !== 'number' || typeof pokemon.moveId !== 'number') {
                    return res.status(400).json({ message: 'Ungültige Pokémon-ID oder Move-ID.' });
                 }
                await forgetPokemonMove(playerId, pokemon.id, pokemon.moveId);
                break;
              default:
                return res.status(400).json({ message: 'Ungültige Pokémon-Aktion.' });
            }

            // Optional: Aktualisierte Pokémon-Daten zurücksenden
            const updatedPokemon = await db.PlayerPokemon.findAll({
              where: { PlayerId: playerId },
              include: [
                { model: db.PokemonBase, attributes: ['id', 'name', 'primary_type', 'secondary_type'] },
                {
                  model: db.Move,
                  attributes: ['id', 'name', 'type', 'power', 'accuracy', 'pp'],
                  through: { attributes: ['pp_current', 'pp_max', 'move_slot'] } // Daten aus Zwischentabelle
                }
              ],
              order: [
                  // Zuerst nach Team sortieren, dann nach Position im Team, dann nach ID
                  ['is_in_team', 'DESC'],
                  ['team_position', 'ASC'],
                  ['id', 'ASC']
              ]
            });

            res.status(200).json({
              message: 'Pokémon-Daten erfolgreich aktualisiert',
              pokemon: formatPokemonData(updatedPokemon) // Formatierungsfunktion verwenden
            });

          } catch (error) {
            console.error(`Fehler bei Pokémon-Aktion '${action}':`, error);
            // Detailliertere Fehlermeldung an Client senden, wenn sinnvoll
            res.status(500).json({ message: error.message || `Serverfehler bei Pokémon-Aktion '${action}'.` });
          }
        };

        // --- Hilfsfunktionen (innerhalb oder außerhalb von exports) ---

        async function reorderPokemonTeam(playerId, pokemonOrder) {
          const transaction = await db.sequelize.transaction();
          try {
            for (const entry of pokemonOrder) {
              const { id, position } = entry;
              await db.PlayerPokemon.update(
                { team_position: position },
                { where: { id: id, PlayerId: playerId, is_in_team: true }, transaction }
              );
            }
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
        }

        async function movePokemonToStorage(playerId, pokemonId) {
          const transaction = await db.sequelize.transaction();
          try {
            const pokemon = await db.PlayerPokemon.findOne({ where: { id: pokemonId, PlayerId: playerId, is_in_team: true }, transaction });
            if (!pokemon) throw new Error('Pokémon nicht im Team gefunden.');

            pokemon.is_in_team = false;
            pokemon.team_position = null;
            await pokemon.save({ transaction });

            // Team-Positionen neu ordnen
            const teamPokemon = await db.PlayerPokemon.findAll({
              where: { PlayerId: playerId, is_in_team: true },
              order: [['team_position', 'ASC']],
              transaction
            });
            for (let i = 0; i < teamPokemon.length; i++) {
              if (teamPokemon[i].team_position !== i) {
                 teamPokemon[i].team_position = i;
                 await teamPokemon[i].save({ transaction });
              }
            }
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
        }

        async function movePokemonToTeam(playerId, pokemonId, desiredPosition) {
           const transaction = await db.sequelize.transaction();
           try {
               const teamCount = await db.PlayerPokemon.count({ where: { PlayerId: playerId, is_in_team: true }, transaction });
               if (teamCount >= 6) { // Max 6 Pokémon im Team
                   throw new Error('Das Team ist bereits voll (max. 6 Pokémon).');
               }

               const pokemonToMove = await db.PlayerPokemon.findOne({ where: { id: pokemonId, PlayerId: playerId, is_in_team: false }, transaction });
               if (!pokemonToMove) throw new Error('Pokémon nicht im Lager gefunden.');

               let targetPosition = (desiredPosition !== undefined && desiredPosition >= 0 && desiredPosition <= teamCount) ? desiredPosition : teamCount;

               // Pokémon, die im Team nach der Zielposition sind, nach hinten verschieben
               await db.PlayerPokemon.increment('team_position', {
                   by: 1,
                   where: {
                       PlayerId: playerId,
                       is_in_team: true,
                       team_position: { [db.Sequelize.Op.gte]: targetPosition }
                   },
                   transaction
               });

               // Pokémon ins Team an die Zielposition setzen
               pokemonToMove.is_in_team = true;
               pokemonToMove.team_position = targetPosition;
               await pokemonToMove.save({ transaction });

               await transaction.commit();
           } catch (error) {
               await transaction.rollback();
               throw error;
           }
        }


        async function updatePokemonStats(playerId, pokemonData) {
          const { id, hp, experience, level } = pokemonData;
          const pokemon = await db.PlayerPokemon.findOne({ where: { id: id, PlayerId: playerId } });
          if (!pokemon) throw new Error('Pokémon nicht gefunden.');

          // Update HP, Experience, Level (inkl. Max HP Anpassung bei Level-Up)
          if (hp !== undefined) pokemon.current_hp = Math.max(0, Math.min(hp, pokemon.max_hp)); // HP begrenzen
          if (experience !== undefined) pokemon.experience = Math.max(0, experience);
          if (level !== undefined && level > pokemon.level) {
              const base = await db.PokemonBase.findByPk(pokemon.PokemonBaseId);
              const newMaxHp = calculateMaxHp(base.base_hp, level); // Annahme: calculateMaxHp existiert
              pokemon.level = level;
              pokemon.max_hp = newMaxHp;
              pokemon.current_hp = newMaxHp; // Voll heilen bei Level-Up
          } else if (level !== undefined) {
              pokemon.level = level;
          }
          await pokemon.save();
        }

        // Annahme: Hilfsfunktion zur HP-Berechnung
        function calculateMaxHp(baseHp, level) {
           // Beispielhafte Formel, anpassen nach Bedarf
           return Math.floor(((2 * baseHp + 31 + Math.floor(0 / 4)) * level) / 100) + level + 10;
        }


        async function learnPokemonMove(playerId, pokemonId, moveId, slot) {
           const pokemon = await db.PlayerPokemon.findOne({ where: { id: pokemonId, PlayerId: playerId }, include: [db.Move] });
           if (!pokemon) throw new Error('Pokémon nicht gefunden.');

           const currentMoves = pokemon.Moves || [];
           if (currentMoves.length >= 4 && slot === undefined) throw new Error('Pokémon kennt bereits 4 Attacken.');
           if (currentMoves.some(m => m.id === moveId)) throw new Error('Pokémon kennt diese Attacke bereits.');

           const move = await db.Move.findByPk(moveId);
           if (!move) throw new Error('Attacke nicht gefunden.');

           const transaction = await db.sequelize.transaction();
           try {
               let targetSlot = slot;
               if (targetSlot === undefined) {
                   // Finde ersten freien Slot (0-3)
                   const usedSlots = currentMoves.map(m => m.PokemonMove.move_slot);
                   for (let i = 0; i < 4; i++) {
                       if (!usedSlots.includes(i)) {
                           targetSlot = i;
                           break;
                       }
                   }
               } else {
                   // Ersetze Attacke im angegebenen Slot
                   await db.PokemonMove.destroy({ where: { PlayerPokemonId: pokemonId, move_slot: targetSlot }, transaction });
               }

               if (targetSlot === undefined || targetSlot < 0 || targetSlot > 3) {
                  throw new Error("Kein freier Attacken-Slot verfügbar oder ungültiger Slot angegeben.");
               }

               await db.PokemonMove.create({
                   PlayerPokemonId: pokemonId,
                   MoveId: moveId,
                   pp_current: move.pp,
                   pp_max: move.pp,
                   move_slot: targetSlot
               }, { transaction });

               await transaction.commit();
           } catch (error) {
               await transaction.rollback();
               throw error;
           }
        }

        async function forgetPokemonMove(playerId, pokemonId, moveId) {
           const result = await db.PokemonMove.destroy({
               where: { PlayerPokemonId: pokemonId, MoveId: moveId }
           });
           if (result === 0) throw new Error('Attacke nicht gefunden oder konnte nicht vergessen werden.');
        }

        // Hilfsfunktion zum Formatieren der Pokémon-Daten für den Client
        function formatPokemonData(pokemonList) {
            return pokemonList.map(p => ({
                id: p.id,
                baseId: p.PokemonBaseId,
                name: p.PokemonBase.name,
                nickname: p.nickname,
                level: p.level,
                type1: p.PokemonBase.primary_type,
                type2: p.PokemonBase.secondary_type,
                hp: p.current_hp,
                maxHp: p.max_hp,
                experience: p.experience,
                isInTeam: p.is_in_team,
                teamPosition: p.team_position,
                moves: (p.Moves || []).map(m => ({
                    id: m.id,
                    name: m.name,
                    type: m.type,
                    power: m.power,
                    accuracy: m.accuracy,
                    pp: m.PokemonMove.pp_current,
                    maxPp: m.PokemonMove.pp_max,
                    slot: m.PokemonMove.move_slot
                })).sort((a, b) => a.slot - b.slot) // Nach Slot sortieren
            }));
        }
        ```

2.  **Route hinzufügen (`server/routes/saveRoutes.js`):**
    *   Öffne die Datei `server/routes/saveRoutes.js`.
    *   Füge die Route für das Pokémon-Update hinzu:
        ```javascript
        // Pokémon-Team/Lager aktualisieren
        // POST /api/save/pokemon
        router.post('/pokemon', saveController.updatePokemonTeam);
        ```

3.  **`loadGame`-Funktion anpassen (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Erweitere die `include`-Option in `db.Player.findByPk` innerhalb der `loadGame`-Funktion, um `PlayerPokemon` (mit `PokemonBase` und `Move` über `PokemonMove`) mitzuladen:
        ```javascript
        // Innerhalb von exports.loadGame = async (req, res) => { ... }
        const player = await db.Player.findByPk(playerId, {
          include: [
            {
              model: db.InventoryItem,
              include: [{ model: db.Item, attributes: ['id', 'name', 'type', 'icon'] }]
            },
            { // NEU: Pokémon-Daten laden
              model: db.PlayerPokemon,
              include: [
                { model: db.PokemonBase, attributes: ['id', 'name', 'primary_type', 'secondary_type', 'base_hp'] }, // Basis-HP für HP-Berechnung
                {
                  model: db.Move,
                  attributes: ['id', 'name', 'type', 'power', 'accuracy', 'pp'],
                  through: { attributes: ['pp_current', 'pp_max', 'move_slot'] } // Daten aus Zwischentabelle
                }
              ]
            }
            // Weitere Includes für Fortschritt etc. kommen in späteren Tickets
          ],
          order: [ // Pokémon nach Team-Status und Position sortieren
              [db.PlayerPokemon, 'is_in_team', 'DESC'],
              [db.PlayerPokemon, 'team_position', 'ASC'],
              [db.PlayerPokemon, 'id', 'ASC']
          ]
        });
        ```
    *   Füge die formatierten Pokémon-Daten zur `gameData`-Antwort hinzu (verwende die Hilfsfunktion):
        ```javascript
        // Innerhalb von exports.loadGame, nach gameData.inventory
        pokemon: formatPokemonData(player.PlayerPokemons || []), // Formatierungsfunktion verwenden
        // Weitere Daten (Fortschritt etc.) werden später hinzugefügt
        ```

**Akzeptanzkriterien:**

*   Die Funktion `updatePokemonTeam` existiert im `saveController` und verarbeitet die Aktionen `reorder`, `move_to_storage`, `move_to_team`, `update_stats`, `learn_move`, `forget_move` korrekt (inkl. Nutzung von Transaktionen wo nötig).
*   Die Route `POST /api/save/pokemon` ist in `saveRoutes.js` definiert und ruft `updatePokemonTeam` auf.
*   Ein authentifizierter POST-Request an `/api/save/pokemon` mit gültigen Daten aktualisiert die Pokémon-Daten des Spielers korrekt.
*   Fehlerhafte Anfragen (ungültige IDs, volles Team etc.) führen zu entsprechenden Fehler-Statuscodes (400, 500) und Meldungen.
*   Die `loadGame`-Funktion lädt nun auch die Pokémon des Spielers (Team und Lager, inkl. Basisdaten und Attacken) und gibt sie im erwarteten Format zurück.
*   Der Server startet ohne Fehler.

**Wichtige Hinweise:**
*   Die Komplexität der Pokémon-Verwaltung ist hoch. Die Hilfsfunktionen sollten sorgfältig implementiert und getestet werden, insbesondere die Logik zum Neuanordnen und Verschieben unter Berücksichtigung der Teamgröße (max. 6).
*   Die `calculateMaxHp`-Funktion ist nur ein Beispiel und muss entsprechend der Spielmechanik implementiert werden.
*   Die `formatPokemonData`-Hilfsfunktion sorgt für ein konsistentes Datenformat für den Client.
*   Die Sortierung beim Laden (`order`) stellt sicher, dass das Team korrekt geordnet an den Client gesendet wird.