const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PokemonMove = sequelize.define('PokemonMove', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pp_current: {
      type: DataTypes.INTEGER
    },
    pp_max: {
      type: DataTypes.INTEGER
    },
    move_slot: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 4
      }
    }
  });

  return PokemonMove;
};
