const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlayerPokemon = sequelize.define('PlayerPokemon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: DataTypes.STRING(50)
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    current_hp: {
      type: DataTypes.INTEGER
    },
    max_hp: {
      type: DataTypes.INTEGER
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_in_team: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    team_position: {
      type: DataTypes.INTEGER
      // 0-9 für Team, NULL für Lager
    },
    caught_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    caught_location: {
      type: DataTypes.STRING(50)
    }
  });

  return PlayerPokemon;
};
