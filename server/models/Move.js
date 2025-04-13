const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Move = sequelize.define('Move', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false
      // 'physical', 'special', 'status'
    },
    power: {
      type: DataTypes.INTEGER
    },
    accuracy: {
      type: DataTypes.INTEGER
    },
    pp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    effect: {
      type: DataTypes.TEXT
    },
    description: {
      type: DataTypes.TEXT
    }
  });

  return Move;
};
