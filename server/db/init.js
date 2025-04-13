const db = require('../models');
const initialData = require('./seed-data');
const bcrypt = require('bcrypt');

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
      { username: 'test1', password_hash: await bcrypt.hash('test', 10) },
      { username: 'test2', password_hash: await bcrypt.hash('test', 10) },
      { username: 'test3', password_hash: await bcrypt.hash('test', 10) }
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
