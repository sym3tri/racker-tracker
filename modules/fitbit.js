'use strict';

var OAuth = require('oauth'),
  Q = require('q');

require('datejs');

module.exports = function(config) {
  var ENDPOINTS = {
    base: 'https://api.fitbit.com/1/',
    profile: 'user/-/profile.json'
  };

  function webhandler(app) {
    var User = app.get('db').models.User;

    app.get('/register/fitbit', function(req, res) {
      var message = 'none',
        fitbit_config = config.fitbit,
        oauth = fitbit_oauth(fitbit_config);

      if(!req.session.fitbit) {
        req.session.fitbit = {};
      }

      if(req.session.user) {
        res.render('register/fitbit', {
          title: 'Register with Fitbit',
          user: req.session.user
        });
      }
      else if(!req.session.fitbit.token && !req.session.fitbit.secret) {
        oauth.getOAuthRequestToken(
          function(error, oauth_token, oauth_token_secret, results) {
          if(error) {
            console.error('error in OAuthRequestToken: ',
              JSON.stringify(error));
          }
          else {
            req.session.fitbit = {
              secret: oauth_token_secret
            };
            res.redirect(fitbit_config.authorize_url +
              '?oauth_token=' + oauth_token);
          }
        });
        return;
      }
      else if(!req.session.fitbit.token && req.session.fitbit.secret) {
        oauth.getOAuthAccessToken(req.query.oauth_token,
          req.session.fitbit.secret, req.query.oauth_verifier, accessTokenCallback);
        return;
      }

      function accessTokenCallback(error, access_token,
        access_token_secret, results) {

        var user;

        if(error) {
          message = 'error in accessTokenCallback' + JSON.stringify(error);
        }
        else {
          req.session.fitbit = {
            token: access_token,
            secret: access_token_secret
          };

          user = {
            'token': access_token,
            'secret': access_token_secret,
            'service': 'fitbit'
          };

          oauth.get(ENDPOINTS.base + ENDPOINTS.profile,
            user.token, user.secret, function(error, data) {
            var profile = JSON.parse(data);

            user.name = profile.user.fullName;

            req.session.user = user;
            res.redirect('/register/fitbit');
          });
        }
      }
    });

    app.post('/register/fitbit', function(req, res) {
      var userValues = req.session.user;

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
            res.redirect('/');
          });

      });
    });

    /* for testing the fetch function */
    app.get('/fitbit/fetch', function(req, res) {
      User.find(2).success(function(user) {
        fetch(user, Date.today().addDays(-7), Date.today())
        .then(function(data) {
          res.send(data);
        }, function() {
          res.send('error');
        });
      });
    });
  }

  function fitbit_oauth(fitbit_config) {
    if(!fitbit_config) {
      fitbit_config = config.fitbit;
    }

    return new OAuth.OAuth(
      fitbit_config.request_token_url,
      fitbit_config.access_token_url,
      fitbit_config.consumer_key,
      fitbit_config.consumer_secret,
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
  }

  function get_activity(oauth, user, date) {
    var deferred = Q.defer();
    oauth.get(ENDPOINTS.base + 'user/-/activities/date/' +
      date.toString('yyyy-MM-dd') + '.json',
      user.token, user.secret, function(error, data) {
        if(error) {
          if(401 === error.statusCode) {
            deferred.reject(new Error('unauthorized'));
          }
          else {
            deferred.reject(new Error(JSON.stringify(error)));
          }
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
      oauth = fitbit_oauth(),
      requests = [],
      date = start_date;

    while(date.getTime() <= end_date.getTime()) {
      requests.push(get_activity(oauth, user, date.clone()));
      date.addDays(1);
    }

    Q.spread(requests, function() {
      var days = Array.prototype.slice.call(arguments),
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
  }


  return {
    fetch: fetch,
    webhandler: webhandler
  };
};

