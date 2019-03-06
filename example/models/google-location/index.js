const methods = require('./methods');
const { loadExternalMethods } = require('../../utils/loadExternalMethods');

module.exports = (sequelize, DataTypes) => {
  const GoogleLocation = sequelize.define(
    'GoogleLocation',
    {
      place_id: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING,
      },

      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      address: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      website: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      map_link: {
        allowNull: false,
        type: DataTypes.STRING,
      },

      phone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
  );

  GoogleLocation.associate = (models) => {
    // associations
  };
  
  loadExternalMethods(GoogleLocation, methods);

  return GoogleLocation;
};
