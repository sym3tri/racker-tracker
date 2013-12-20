'use strict';

var humanize = require('humanize'),
    util = require('../util');

function users(app) {
  var sequelize = app.get('db').sequelize,
    handler;

  handler = function(req, res) {
    var since = req.query.since || 'all',
      dateSince,
      query =
      'SELECT name, Users.createdAt, ' +
      'SUM(calories) AS calories, SUM(steps) AS steps ' +
      'FROM Users LEFT JOIN ( ' +
        'SELECT userid, calories, steps FROM Stats ';

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
      'WHERE private = false ' +
      'GROUP BY Users.id';

    sequelize.query(query)
    .success(function(users) {
      users.forEach(function(user) {
        if(null !== user.steps) {
          user.steps = humanize.numberFormat(user.steps, 0);
        }
        else {
          user.steps = 0;
        }

        if(null !== user.calories) {
          user.calories = humanize.numberFormat(user.calories, 0);
        }
        else {
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
