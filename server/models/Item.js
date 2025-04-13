const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Item = sequelize.define('Item', {
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
      // 'ball', 'medicine', 'hold', 'tm', 'hm', 'quest', 'berry', 'other'
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(10)
    },
    usable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    effect: {
      type: DataTypes.TEXT
    }
  });

  return Item;
};
