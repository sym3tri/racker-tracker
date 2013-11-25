'use strict';

var OAuth = require('oauth'),
  Q = require('q'),
  ENDPOINTS = {
    base: 'https://api.fitbit.com/1/',
    profile: 'user/-/profile.json'
  };

require('datejs');

function Fitbit(config, app) {
  this.app = app;
  this.config = config;
  this.oauth = this.makeOauth();
}

Fitbit.prototype.makeOauth = function() {
  return new OAuth.OAuth(
    this.config.request_token_url,
    this.config.access_token_url,
    this.config.consumer_key,
    this.config.consumer_secret,
    '1.0',
    null,
    'HMAC-SHA1',
    32,
    {
      'Accept': '*/*',
      'Accept-Language': 'en_US',
      'Accept-Locale': 'en_US',
      'Connection': 'close',
      'User-Agent': 'racker-tracker'
    }
  );
};

Fitbit.prototype.get_activity = function(user, date) {
  var deferred, endpoint;
  deferred = Q.defer();
  endpoint = ENDPOINTS.base + 'user/-/activities/date/' +
    date.toString('yyyy-MM-dd') + '.json';





  this.oauth.get(endpoint, user.token, user.secret,
    function(error, data) {
      var activity;
      if (error) {
        if (401 === error.statusCode) {
          deferred.reject(new Error('unauthorized'));
        } else {
          deferred.reject(new Error(JSON.stringify(error)));
        }
        return;
      }
      activity = JSON.parse(data);
      activity.date = date;
      deferred.resolve(activity);
    });
  return deferred.promise;
};

Fitbit.prototype.fetch = function(user, start_date, end_date) {
  var deferred = Q.defer(),
      requests = [],
      date = start_date;

  while(date.getTime() <= end_date.getTime()) {
    requests.push(this.get_activity(user, date.clone()));
    date.addDays(1);
  }

  Q.spread(requests, function() {
    var days, stats;
    days = Array.prototype.slice.call(arguments);
    stats = days.filter(function(day) {
      var summary = day.summary;
      return summary.steps !== 0 && summary.calories !== 0;
    }).map(function(day) {
      var summary = day.summary;
      return {
        'date': day.date,
        'steps': summary.steps,
        'calories': summary.caloriesOut
      };
    });
    deferred.resolve(stats);
  }, function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

/*
 * GET request handler.
 */
Fitbit.prototype.getHandler = function(req, res) {
  var message = 'none',
      session = req.session,
      oauth = this.oauth;

  function accessTokenCallback(error, access_token,
    access_token_secret, results) {
    var user;
    if (error) {
      message = 'error in accessTokenCallback' + JSON.stringify(error);
    } else {
      session.fitbit = {
        token: access_token,
        secret: access_token_secret
      };
      user = {
        'token': access_token,
        'secret': access_token_secret,
        'service': 'fitbit'
      };
      oauth.get(ENDPOINTS.base + ENDPOINTS.profile,
        user.token, user.secret,
        function(error, data) {
          var profile = JSON.parse(data);
          user.name = profile.user.fullName;
          req.session.user = user;
          res.redirect('/register/fitbit');
        });
    }
  }

  if (!session.fitbit) {
    session.fitbit = {};
  }

  if (session.user) {
    // TODO: send user: req.session.user
    res.redirect('/register/fitbit');
    return;
  }

  if (!session.fitbit.token && !session.fitbit.secret) {
    this.oauth.getOAuthRequestToken(
      function(error, oauth_token, oauth_token_secret, results) {
        if (error) {
          console.error('error in OAuthRequestToken: ', JSON.stringify(error));
        }
        else {
          session.fitbit = {
            secret: oauth_token_secret
          };
          res.redirect(this.config.authorize_url +
            '?oauth_token=' + oauth_token);
        }
      }.bind(this));
    return;
  }

  if (!session.fitbit.token && session.fitbit.secret) {
    this.oauth.getOAuthAccessToken(
        req.query.oauth_token,
        session.fitbit.secret,
        req.query.oauth_verifier,
        accessTokenCallback);
    return;
  }

};

Fitbit.prototype.postHandler = function(req, res) {
  var User = this.app.get('db').models.User,
      userValues = req.session.user;
  userValues.name = req.body.name;
  userValues.email = req.body.email;
  userValues.active = true;
  User.find({ where: { email: userValues.email } })
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
          res.redirect('/register/complete');
        });
  });
};

module.exports = Fitbit;
