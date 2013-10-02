var request = require('request'),
    _ = require('underscore'),
    Q = require('Q'),
    endpoint = 'https://api.nike.com/me/sport/activities';

function filterFuelBand(activityItem) {
  return activityItem.deviceType === "FUELBAND";
}

function mapMetrics(activityItem) {
  return {
    date: Date.parse(activityItem.startTime),
    steps: activityItem.metricSummary.steps,
    calories: activityItem.metricSummary.calories
  };
}

function fetch(token, startDate, endDate) {
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
      'access_token': token,
      'count': 100,
      'startDate': startDate,
      'endDate': endDate,
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
    fetch: fetch,
    login: login
  };
}
