const methods = require('./methods');
const { loadExternalMethods } = require('sequelize-external-methods');

// directory based Model export
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
    {
      // defined internally using standard Sequelize Syntax
      getterMethods: {
        /**
         * Instance getter for the Google Maps URL
         * @example
         * googlLocation.url // Google Maps link
         */
        url: function() {
          return this.map_link;
        }
      }
    }
  );

  GoogleLocation.associate = (models) => {
    // associations
  };
  
  // last call before returning Model
  // ensures override warnings are emitted if encountered
  loadExternalMethods(GoogleLocation, methods);

  // GoogleLocation now has:
  // GoogleLocation.refreshLocation [static]
  // GoogleLocation.url [instance getter]
  // GoogleLocation.needsRefresh [instance getter]

  return GoogleLocation;
};
