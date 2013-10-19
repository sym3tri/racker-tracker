'use strict';

var datejs = require('datejs'),
  request = require('request'),
  Q = require('q');

module.exports = {

  pad: function(s) {
    return s < 10 ? '0' + s : s;
  },

  parseDate: function(date) {
    var d,
      ts = parseInt(date, 10);

    if (date instanceof Date) {
      d = date;
    } else if (isNaN(ts)) {
      d = Date.parse(date);
    } else {
      console.log('ts: ' + ts);
      d = new Date(ts);
    }

    return d.toString('yyyy-MM-dd');
  },

  request: function(options) {
    var deferred = Q.defer();
    request(options, function(err, res, body) {
      if(err) {
        deferred.reject(err);
        return;
      }
      if(res.headers['content-type'] === 'application/json') {
        console.log('body:', body);
        body = JSON.parse(body);
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  }

};
