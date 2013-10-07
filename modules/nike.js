'use strict';

var request = require('request'),
    util = require('../util'),
    Q = require('Q'),
    endpoint = 'https://api.nike.com/me/sport/activities';

function webhandler(app) {
  app.get('/register/nike', function(req, res){
    res.render('register/nike', { title: 'Register' });
  });

  app.post('/register-nike', function(req, res) {
    console.log(req.body);

    var User = app.get('models').User;

    var userValues = {
      email: req.body.email,
      name: req.body.name,
      service: 'nike',
      token: req.body.token
    };

    User.find({ where: { email: req.body.email } })
      .success(function(user) {
        if (user) {
          user.updateAttributes(userValues);
        } else {
          user = User.build(userValues);
        }

        user.save()
          .error(function(e) {
            console.log('DB ERROR!!!');
            console.log(e);
            res.send('ERROR: ' + e.code);
          })
          .success(function() {
            console.log('SAVE OK!!!');
            res.send('it worked! thanks ' + user.getFullname());
          });

      });

    // retrieve token

    // save token in DB
  });


}

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
    util.pad(d.getMonth()) + '-' +
    util.pad(d.getDay());
}

function fetch(user, startDate, endDate) {
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
      deferred.reject(new Error(body));
    } else {
      result = JSON.parse(body).data.filter(filterFuelBand).map(mapMetrics);
      deferred.resolve(result);
    }
  });
  return deferred.promise;
}

// XXX: this solution is the old hacky api that uses cookies.
// wont use this, but will leave code for now since it works.
function login(username, password) {
  var result, deferred, reqBody;

  reqBody = 'app=b31990e7-8583-4251-808f-9dc67b40f5d2&format=json&contentType=plaintext&email=' + 
    encodeURIComponent(username) + '&password=' + encodeURIComponent(password);

  deferred = Q.defer();
  request({
    method: 'POST',
    followRedirect: true,
    followAllRedirects: true,
    uri: 'https://secure-nikeplus.nike.com/nsl/services/user/login?app=b31990e7-8583-4251-808f-9dc67b40f5d2&format=json&contentType=plaintext',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: reqBody
  }, function(err, res, body) {
    if (err) {
      console.log(err);
      deferred.reject(new Error(err));
    } else if (res.statusCode !== 200) {
      deferred.reject(new Error(body));
    } else {
      result = body;
      deferred.resolve(result);
    }
  });
  return deferred.promise;
}

module.exports = function nike(config) {
  return {
    webhandler: webhandler,
    fetch: fetch,
    login: login
  };
};
