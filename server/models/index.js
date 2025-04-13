const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const sequelize = require('../db/config');
const db = {};

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
