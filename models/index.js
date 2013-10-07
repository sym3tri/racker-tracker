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
    Stats: sequelize.import(__dirname + '/stats')
  };

  //models.Stats.belongsTo(models.User);
  //models.User.hasMany(models.Stats);

  // Sync all models/tables.
  sequelize.sync()
    .error(function(e) {
      console.log('ERROR: syncing models to database!');
      console.log(e);
    })
    .success(function() {
      console.log('OK: synced models to database.');
    });

  return {
    models: models,
    sequelize: sequelize
  };

}
