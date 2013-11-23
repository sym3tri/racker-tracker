'use strict';

var Sequelize = require('sequelize');

module.exports = function(config) {
  var sequelize, models;

  // Instance of the ORM database driver.
  sequelize = new Sequelize(
        config.dbname,
        config.dbusername,
        config.dbpassword || null,
        {
          host: config.dbhost,
          define: {
            charset: 'utf8',
            collate: 'utf8_general_ci'
          }
        }
    );

  // Import all models.
  models = {
    User: sequelize.import(__dirname + '/user'),
    Stats: sequelize.import(__dirname + '/stats'),
    Office: sequelize.import(__dirname + '/office')
  };

  models.Office.hasMany(models.User, {as: 'Workers'});

  // Sync all models/tables.
  sequelize.sync()
    .error(function(e) {
      console.log('ERROR: syncing models to database!');
      console.log(e);
    })
    .success(function() {
      console.log('OK: synced models to database.');
      models.Office.count().success(function(officeCount) {
        if(officeCount === 0) {
          var offices = [
            {name: 'San Francisco', code: 'SFO'},
            {name: 'San Antonio', code: 'SAT'},
            {name: 'London', code: 'LON'},
            {name: 'Austin', code: 'AUS'},
            {name: 'Blacksburg', code: 'BCB'}
          ];
          offices.forEach(function(o) {
            models.Office.create(o)
              .error(function(err) {
                console.error('failed to create office: ' + err);
              });
          });
        }
      });
    });

  return {
    models: models,
    sequelize: sequelize
  };

};
