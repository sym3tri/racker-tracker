var OAuth = require('oauth'),
  fs = require('fs'),
  Q = require('Q'),
  datejs = require('datejs');

module.exports = function fitbit(app) {
	var ENDPOINTS = {
		base: 'https://api.fitbit.com/1/',
    profile: 'user/-/profile.json'
	};

  app.get('/register/fitbit', function(req, res) {
    var message = "none";
    var fitbit_config = app.get('config').fitbit;

    var oauth = fitbit_oauth(fitbit_config);
    if(!req.session.fitbit) {
      req.session.fitbit = {};
    }

    if(!req.session.fitbit.token && !req.session.fitbit.secret) {
      oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
          console.error("error in OAuthRequestToken: ", JSON.stringify(error));
        }
        else {
          req.session.fitbit = {
            secret: oauth_token_secret
          };
          res.redirect(fitbit_config.authorize_url + "?oauth_token=" + oauth_token);
        }
      });
      return;
    }
    else if(!req.session.fitbit.token && req.session.fitbit.secret) {
      console.log("oauth_token: "+req.query.oauth_token);
      oauth.getOAuthAccessToken(req.query.oauth_token, req.session.fitbit.secret, req.query.oauth_verifier, accessTokenCallback);
      return;
    }
    res.render('register/fitbit', {
      title: 'Test Fitbit',
      message: message
    });

    function accessTokenCallback(error, access_token, access_token_secret, results) {
      if(error) {
        message = "error in accessTokenCallback" + JSON.stringify(error);
      }
      else {
        req.session.fitbit = {
          token: access_token,
          secret: access_token_secret
        };
        var User = app.get('models').User;

        var user = User.build({
          'token': access_token,
          'secret': access_token_secret,
          'service': 'fitbit'
        });

        oauth.get(ENDPOINTS.base + ENDPOINTS.profile,
          user.token, user.secret, function(error, data, response) {
          var profile = JSON.parse(data);

          user.lastname = profile.user.fullName;
          user.email = '';
          user.firstname = '';
          user.save();
          res.redirect('/');
        });
      }
    }
  });

  function fitbit_oauth(fitbit_config) {
    if(!fitbit_config) {
      fitbit_config = app.get('config').fitbit;
    }

    return new OAuth.OAuth(
      fitbit_config.request_token_url,
      fitbit_config.access_token_url,
      fitbit_config.consumer_key,
      fitbit_config.consumer_secret,
      "1.0",
      null,
      "HMAC-SHA1",
      32,
      {
        "Accept": "*/*",
        "Accept-Language": "en_US",
        "Accept-Locale": "en_US",
        "Connection": "close",
        "User-Agent": "racker-tracker"
      }
    );
  }

  function get_activity(oauth, user, date) {
    var deferred = Q.defer();
    oauth.get(ENDPOINTS.base + "user/-/activities/date/"+date+".json",
      user.token, user.secret, function(error, data, response) {
        if(error) {
          deferred.reject(new Error(error));
          return;
        }
        var activity = JSON.parse(data);
        activity.date = date;
        deferred.resolve(activity);
      });
     return deferred.promise;
  }

  function fetch(user, start_date, end_date) {
    var deferred = Q.defer(),
      date_format = "yyyy-MM-dd",
      oauth = fitbit_oauth(),
      requests = [],
      date = start_date;

    while(date.getTime() <= end_date.getTime()) {
      requests.push(get_activity(oauth, user, date.toString(date_format)));
      date.addDays(1);
    }

    Q.spread(requests, function() {
      var days = Array.prototype.slice.call(arguments);
      var stats = days.map(function(day) {
        var summary = day.summary;
        return {
          'date': day.date,
          'steps': summary.steps,
          'calories': summary.marginalCalories
        };
      });
      deferred.resolve(stats);
    },function() {
      deferred.reject('failed to get data from fitbit');
    });

    return deferred.promise;
  }

  /* for testing the fetch function */
  app.get('/fitbit/fetch', function(req, res) {
    var User = app.get('models').User;

    User.find(2).success(function(user) {
      fetch(user, Date.today().addDays(-7), Date.today())
      .then(function(data) {
        res.send(data);
      }, function() {
        res.send('error');
      });
    });
  });

  return {
    fetch: fetch
  };
};

