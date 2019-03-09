'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';
var config     = require(__dirname + '/../config/config.js')[env];
var db        = {};

var sequelize = new Sequelize(config.database, config.username, config.password, config);

// exports file or directory based Models
fs
  .readdirSync(__dirname)
  .filter(file => file !== basename)
  .forEach(file => {
    const isDirectory = file.slice(-3) !== '.js';
    const importPath = isDirectory ? [__dirname, file, 'index.js'] : [__dirname, file];
    
    var model = sequelize['import'](path.join(...importPath));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
