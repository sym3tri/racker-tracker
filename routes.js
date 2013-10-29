'use strict';

var humanize = require('humanize'),
  util = require('./util');


var routes = function(app) {

  /*
   * GET home page.
   */
  app.get('/', function(req, res) {
    res.render('index', { title: 'Racker Tracker' });
  });

  app.get('/register', function(req, res){
    res.render('register', { title: 'Register' });
  });

  app.get('/about', function(req, res){
    res.render('about', { title: 'About' });
  });

  app.get('/users', function(req, res) {
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
          dateSince = Date.today().moveToDayOfWeek(0, -1);
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
      users.forEach(function(user, i) {
        if(null !== user.steps) {
          users[i].steps = humanize.numberFormat(user.steps, 0);
        }
        else {
          users[i].steps = 0;
        }

        if(null !== user.calories) {
          users[i].calories = humanize.numberFormat(user.calories, 0);
        }
        else {
          users[i].calories = 0;
        }
      });
      res.render('users', {
        title: 'User List',
        users: users,
        since: since
      });
    });

  });

};

module.exports = routes;
