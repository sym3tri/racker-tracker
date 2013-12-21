'use strict';

var util = require('../util');

function users(app) {
  var models = app.get('db').models,
    sequelize = app.get('db').sequelize,
    handler;

  handler = function(req, res) {
    var since = req.query.since || 'all',
      dateSince,
      query =
      'SELECT Users.*, sum(Stats.calories) AS calories, sum(Stats.steps) AS steps ' +
      'FROM Users LEFT JOIN ( ' +
        'SELECT * FROM Stats ';

    if(since !== 'all') {
      switch(since) {
        case 'today':
          dateSince = Date.today();
          break;
        case 'week':
          // move to previous Sunday
          dateSince = Date.today();
          if(dateSince.getDay() !== 0) {
            dateSince.moveToDayOfWeek(0, -1);
          }
          break;
        case 'month':
          dateSince = Date.today().moveToFirstDayOfMonth();
          break;
        default:
          since = 'all';
      }
      console.log(since);
      if(dateSince) {
        query += 'WHERE Stats.date >= "' + util.toSqlDate(dateSince) + '" ';
      }
    }

    query += ') Stats ' +
      'ON Users.id = Stats.userid ' +
      'GROUP BY Users.id';

    app.get('db').sequelize.query(query)
    .success(function(users) {
      users.forEach(function(user) {
        if(null === user.steps) {
          user.steps = 0;
        }
        if(null === user.calories) {
          user.calories = 0;
        }
        user.createdAtISO = user.createdAt.toISOString();
        user.createdAtReadable = user.createdAt.toString('MMMM dd, yyyy');
      });

      res.json({
        users: users,
        since: since
      });
    });
  };

  return handler;
}

module.exports = users;
