'use strict';

var util = require('../util'),
  Q = require('q');

function stepQuery(office_id, user_id, startDate, endDate, limit) {
  if(!limit) {
    limit = 5;
  }

  var query = 'SELECT ' +
    ' Users.id, Users.name,' +
    ' Offices.id as officeId, Offices.name as officeName, ' +
    '   Offices.code AS officeCode,' +
    ' SUM(steps) AS steps, ' +
    ' MAX(date) as lastDate, MAX(Stats.updatedAt) as lastUpdated' +
    ' FROM ' +
    ' Users JOIN Stats ON Users.id = Stats.userid' +
    ' JOIN Offices ON Users.OfficeId = Offices.id' +
    ' WHERE ' +
    ' date >= \''+ util.toSqlDate(startDate) + '\'' +
    ' AND date < \'' + util.toSqlDate(endDate) +'\'' +
    ' AND private = FALSE ';

  if(office_id) {
    query += ' AND officeid = ' + office_id;
  }

  if(user_id) {
    query += ' AND Users.id = ' + user_id;
  }


  query += ' GROUP BY Users.id' +
    ' ORDER BY steps DESC' +
    ' LIMIT ' + limit;

  return query;
}

function qquery(sequelize, query) {
  var deferred = Q.defer();

  sequelize.query(query)
    .success(function(data) {
      deferred.resolve(data);
    })
    .error(function(err) {
      console.error('error with Query');
      deferred.reject(err);
    });

  return deferred.promise;
}

function data_api(app) {
  var sequelize = app.get('db').sequelize;

  var handler = function(req, res) {
    var office_id = parseInt(req.query.office_id, 10),
      user_id = parseInt(req.query.user_id, 10),
      start = Date.parse(req.query.start),
      end = Date.parse(req.query.end),
      limit = parseInt(req.query.limit, 10);

    if(!start || !end) {
      res.send({
        success: false,
        error: 'make sure you have a start and end date'
      });
      return;
    }

    qquery(sequelize, stepQuery(office_id, user_id, start, end, limit))
      .then(function(users) {
        res.send({
          success: true,
          data: users
        });
      }, function(err) {
        res.send({
          success: false,
          error: 'problem with database ' + err
        });
      });
  };

  return handler;
}

module.exports = data_api;