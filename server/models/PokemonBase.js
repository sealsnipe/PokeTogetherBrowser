const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PokemonBase = sequelize.define('PokemonBase', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pokedex_number: {
      type: DataTypes.INTEGER,
      unique: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    primary_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    secondary_type: {
      type: DataTypes.STRING(20)
    },
    base_hp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_attack: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_defense: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_special_attack: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_special_defense: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    base_speed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    evolution_level: {
      type: DataTypes.INTEGER
    },
    evolution_method: {
      type: DataTypes.STRING(50)
    },
    description: {
      type: DataTypes.TEXT
    }
  });

  return PokemonBase;
};
