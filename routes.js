'use strict';

var humanize = require('humanize'),
  Q = require('q'),
  util = require('./util');


var routes = function(app) {
  var models = app.get('db').models,
    sequelize = app.get('db').sequelize,
    displayLength = 5;

  function stepQuery(startDate, endDate) {
    var query = 'SELECT Users.id, name, SUM(steps) AS steps' +
      ' FROM Users JOIN Stats ON Users.id = Stats.userid' +
      ' WHERE date >= \''+ util.toSqlDate(startDate) + '\'';

    if(endDate) {
      query += ' AND date < \'' + util.toSqlDate(endDate) +'\'';
    }

    query += ' GROUP BY Users.id' +
      ' ORDER BY steps DESC';
      // ' LIMIT 5';

    return query;
  }

  function qquery(query) {
    var deferred = Q.defer();

    sequelize.query(query)
      .success(function(data) {
        deferred.resolve(data);
      });

    return deferred.promise;
  }

  function getMostImproved(lastWeek, thisWeek) {
    var dayOfWeek = Date.today().getDay()+1,
      improvement = [],
      lastWeekLookup = {};

    lastWeek.forEach(function(user) {
      lastWeekLookup[user.id] = user.steps;
    });

    thisWeek.forEach(function(user) {
      if(user.id in lastWeekLookup) {
        improvement.push({
          name: user.name,
          percent: user.steps/(lastWeekLookup[user.id]*dayOfWeek/7) * 100
        });
      }
    });

    improvement.sort(function(a, b) {
      return b.percent - a.percent;
    });

    if(improvement.length > displayLength) {
      improvement.length = displayLength;
    }

    improvement.forEach(function(user) {
      user.percent = humanize.numberFormat(user.percent);
    });

    return improvement;
  }

  /*
   * GET home page.
   */
  app.get('/', function(req, res) {
    var startThisWeek = Date.today().moveToDayOfWeek(0, -1),
      startLastWeek = startThisWeek.clone().add(-7).days(),
      thisWeeksQuery = stepQuery(startThisWeek),
      lastWeeksQuery = stepQuery(startLastWeek, startThisWeek),
      mostImproved;

    Q.spread([
      qquery(thisWeeksQuery),
      qquery(lastWeeksQuery)
      ],
      function(thisWeeksSteps, lastWeeksSteps) {
        mostImproved = getMostImproved(lastWeeksSteps, thisWeeksSteps);

        if(thisWeeksSteps.length > displayLength) {
          thisWeeksSteps.length = displayLength;
        }

        if(lastWeeksSteps.length > displayLength) {
          lastWeeksSteps.length = displayLength;
        }
        thisWeeksSteps.forEach(function(user) {
          user.steps = humanize.numberFormat(user.steps, 0);
        });
        lastWeeksSteps.forEach(function(user) {
          user.steps = humanize.numberFormat(user.steps, 0);
        });

        res.render('index', {
          title: 'Racker Tracker',
          thisWeeksSteps: thisWeeksSteps,
          lastWeeksSteps: lastWeeksSteps,
          mostImproved: mostImproved
        });
      });
    return;
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
