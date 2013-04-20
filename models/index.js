var Sequelize = require('sequelize');

module.exports = function(app) {
  var config, sequelize, User, Stats;

  config = app.get('config');
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
      console.log('error syncing User with db');
      console.log(e);
    })
    .success(function() {
      console.log('User sync worked');
    });

  Stats = sequelize.define('Stats', {
    userid: Sequelize.INTEGER,
    date: Sequelize.DATE,
    calories: Sequelize.INTEGER,
    steps: Sequelize.INTEGER
  });

  Stats.sync()
    .error(function(e) {
      console.log('error syncing Stats with db');
      console.log(e);
    })
    .success(function() {
      console.log('Stats sync worked');
    });


  return {
    sequelize: sequelize,
    User: User,
    Stats: Stats
    //User: sequelize.import(__dirname + '/User')
  };
};
