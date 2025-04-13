const db = require('../models');

async function queryDatabase() {
  try {
    // Spieler abfragen
    const players = await db.Player.findAll();
    console.log('Spieler:');
    players.forEach(player => {
      console.log(`ID: ${player.id}, Benutzername: ${player.username}, Position: (${player.position_x}, ${player.position_y})`);
    });
    
    // Items abfragen
    const items = await db.Item.findAll();
    console.log('\nItems:');
    console.log(`Anzahl der Items: ${items.length}`);
    
    // Pokémon abfragen
    const pokemon = await db.PokemonBase.findAll();
    console.log('\nPokémon:');
    console.log(`Anzahl der Pokémon: ${pokemon.length}`);
    
    // Spieler-Pokémon abfragen
    const playerPokemon = await db.PlayerPokemon.findAll({
      include: [db.PokemonBase]
    });
    console.log('\nSpieler-Pokémon:');
    playerPokemon.forEach(pp => {
      console.log(`ID: ${pp.id}, Pokémon: ${pp.PokemonBase.name}, Level: ${pp.level}, Im Team: ${pp.is_in_team}`);
    });
    
    // Inventar abfragen
    const inventory = await db.InventoryItem.findAll({
      include: [db.Item, db.Player]
    });
    console.log('\nInventar:');
    inventory.forEach(item => {
      console.log(`Spieler: ${item.Player.username}, Item: ${item.Item.name}, Anzahl: ${item.quantity}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler bei der Datenbankabfrage:', error);
    process.exit(1);
  }
}

queryDatabase();
