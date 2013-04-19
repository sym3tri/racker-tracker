var Sequelize = require('sequelize');

module.exports = function(app) {
  var config, sequelize, User;

  config = app.get('config');
  sequelize = new Sequelize(
      config.dbname,
      config.dbusername,
      config.dbpassword, {
    host: '8b59a01c3cb8257733dc2eff635e4ae2c248ee0f.rackspaceclouddb.com'
  });

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
