var request = require('request'),
    _ = require('underscore'),
    endpoint = 'https://api.nike.com/me/sport/activities';

function filterFuelBand(activityItem) {
  return activityItem.deviceType === "FUELBAND";
}

function mapMetrics(activityItem) {
  return {
    id: 'nike-' + activityItem.activityId,
    date: Date.parse(activityItem.startTime),
    steps: activityItem.metricSummary.steps,
    calories: activityItem.metricSummary.calories
  };
}

function fetch(token, startDate, endDate, error, cb) {
  var result;
  request({
    uri: endpoint,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      //'appid':
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
      if (error) {
        error(err);
      }
    } else {
      result = JSON.parse(body).data.filter(filterFuelBand).map(mapMetrics);
      cb(result);
    }
  });
}

function login(username, password) {
  //{"method":"POST","url":"%base_url%/nsl/v2.0/user/login?format=json&app=%25appid%25&client_id=%25client_id%25&client_secret=%25client_secret%25","headers":{"appid":"%appid%","Accept":"application/json","Content-Type":"application/x-www-form-urlencoded"},"body":"email=ed.rooth%40gmail.com&password=tech12"}
}

module.exports = {
  fetch: fetch,
  login: login
};
