'use strict';

var request = require('request'),
    util = require('../util'),
    Q = require('q'),
    endpoint = 'https://api.nike.com/me/sport/activities';

function filterFuelBand(activityItem) {
  return activityItem.deviceType === 'FUELBAND';
}

function mapMetrics(activityItem) {
  return {
    date: Date.parse(activityItem.startTime),
    steps: activityItem.metricSummary.steps,
    calories: activityItem.metricSummary.calories
  };
}

function parseDate(date) {
  var d = Date.parse(date);
  return d.getFullYear() + '-' +
    util.pad(d.getMonth() + 1) + '-' +
    util.pad(d.getDate());
}

function Nike(config, app) {
  this.app = app;
  this.config = config;
}

Nike.prototype.fetch = function(user, startDate, endDate) {
  var result, deferred;

  deferred = Q.defer();
  request({
    uri: endpoint,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'appid': 'fuelband'
    },
    qs: {
      'access_token': user.token,
      'count': 100,
      'startDate': parseDate(startDate),
      'endDate': parseDate(endDate),
    }
  }, function(err, res, body) {
    if (err) {
      console.log(err);
      deferred.reject(new Error(err));
    } else if (res.statusCode !== 200) {
      err = JSON.parse(body);
      if('invalid_token' === err.error) {
        deferred.reject(new Error('unauthorized'));
        return;
      }
      deferred.reject(new Error(body));
    } else {
      result = JSON.parse(body).data.filter(filterFuelBand).map(mapMetrics);
      deferred.resolve(result);
    }
  });
  return deferred.promise;
};

Nike.prototype.postHandler = function(req, res) {
  var User, userValues;

  User = this.app.get('db').models.User;

  userValues = {
    email: req.body.email,
    name: req.body.name,
    service: 'nike',
    token: req.body.token,
    active: true,
    OfficeId: 1
  };

  User.find({ where: { email: req.body.email } })
    .success(function(user) {
      if (user) {
        user.updateAttributes(userValues);
      } else {
        user = User.build(userValues);
      }
      user.save()
        .success(function() {
          res.redirect('/register/complete');
        })
        .error(function(e) {
          console.log('DB ERROR!!!');
          console.log(e);
          res.send('ERROR: ' + e.code);
        });
    });
};

module.exports = Nike;
