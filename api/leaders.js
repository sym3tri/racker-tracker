'use strict';

var humanize = require('humanize'),
    Q = require('q'),
    util = require('../util'),
    DISPLAY_LENGTH = 5;

function stepQuery(startDate, endDate) {
  var query = 'SELECT Users.id, name, SUM(steps) AS steps, ' +
      ' MAX(date) as lastDate, MAX(Stats.updatedAt) as lastUpdated' +
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

function qquery(sequelize, query) {
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
        percent: (user.steps/(lastWeekLookup[user.id]*dayOfWeek/7) - 1) * 100
      });
    }
  });

  improvement.sort(function(a, b) {
    return b.percent - a.percent;
  });

  if(improvement.length > DISPLAY_LENGTH) {
    improvement.length = DISPLAY_LENGTH;
  }

  improvement.forEach(function(user) {
    user.percent = humanize.numberFormat(user.percent);
  });

  return improvement;
}

function leaders(app) {
  var models = app.get('db').models,
    sequelize = app.get('db').sequelize,
    handler;

  handler = function(req, res) {
    var startThisWeek = Date.today(),
      startLastWeek,
      thisWeeksQuery,
      lastWeeksQuery,
      mostImproved;

    if(startThisWeek.getDay() !== 0) {
      startThisWeek.moveToDayOfWeek(0, -1);
    }
    startLastWeek = startThisWeek.clone().add(-7).days();

    thisWeeksQuery = stepQuery(startThisWeek);
    lastWeeksQuery = stepQuery(startLastWeek, startThisWeek);

    Q.spread([
      qquery(sequelize, thisWeeksQuery),
      qquery(sequelize, lastWeeksQuery)
      ],
      function(thisWeeksSteps, lastWeeksSteps) {
        mostImproved = getMostImproved(lastWeeksSteps, thisWeeksSteps);

        if(thisWeeksSteps.length > DISPLAY_LENGTH) {
          thisWeeksSteps.length = DISPLAY_LENGTH;
        }

        if(lastWeeksSteps.length > DISPLAY_LENGTH) {
          lastWeeksSteps.length = DISPLAY_LENGTH;
        }
        thisWeeksSteps.forEach(function(user) {
          user.steps = humanize.numberFormat(user.steps, 0);

          // This is to handle the case were data was fetced
          // more recenlty then it was updated at the source
          if(user.lastDate.toString('yyyy-MM-dd') ===
                user.lastUpdated.toString('yyyy-MM-dd')) {
            user.updated = user.lastUpdated;
          }
          else {
            user.updated = user.lastDate;
          }
          user.lastUpdatedISO = user.updated.toISOString();
          user.lastUpdatedReadable = user.updated.toString('MMM dd HH:mm');
        });
        lastWeeksSteps.forEach(function(user) {
          user.steps = humanize.numberFormat(user.steps, 0);
        });

        res.json({
          thisWeeksSteps: thisWeeksSteps,
          lastWeeksSteps: lastWeeksSteps,
          mostImproved: mostImproved
        });
      });
    return;
  };

  return handler;
}

module.exports = leaders;
