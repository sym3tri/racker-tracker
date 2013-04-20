var Sequelize = require('sequelize');

module.exports = function(app) {
  var config, sequelize, User;

  config = app.get('config');
  console.log(config);
  sequelize = new Sequelize(
      config.dbname,
      config.dbusername,
      config.dbpassword || null,
      {
        host: config.dbhost
      }
  );

  User = sequelize.define('User', {
    email: { type: Sequelize.STRING, unique: true},
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    service: Sequelize.STRING,
    token: Sequelize.STRING
  });

  User.sync()
    .error(function(e) {
      console.log('error syncing with db');
      console.log(e);
    })
    .success(function() {
      console.log('sync worked');
    });

  return {
    sequelize: sequelize,
    User: User
    //User: sequelize.import(__dirname + '/User')
  };
};
