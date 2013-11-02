'use strict';

var url = require('url'),
	OAuth = require('oauth'),
  Q = require('q');

require('datejs');

module.exports = function(config) {
	var api_endpoints = {
      request_token_url: 'https://api.bodymedia.com/oauth/request_token',
      authorize_url: 'https://api.bodymedia.com/oauth/authorize',
      access_token_url: 'https://api.bodymedia.com/oauth/access_token'
    },
    oauth = bodymedia_oauth();

	function webhandler(app) {
    var User = app.get('db').models.User;

		app.get('/register/bodymedia', function(req, res) {
			var oauth = bodymedia_oauth(),
        bmSession;

      if(!req.session.bodymedia) {
        req.session.bodymedia = {};
      }
      bmSession = req.session.bodymedia;

      if(req.session.user) {
        res.render('register/bodymedia', {
          title: 'Register with BodyMedia',
          user: req.session.user
        });
      }
      else if(!bmSession.token && !bmSession.secret) {
        // Step One
        oauth.getOAuthRequestToken({
          'api_key': config.bodymedia.api_key
        },
          function(error, oauth_token, oauth_token_secret) {
            var redirect_url = url.parse(api_endpoints.authorize_url);

            if(error) {
              console.error('error in OAuthRequestToken: ',
                JSON.stringify(error));
              res.send(500, 'Bad Oauth situation');
              return;
            }
            if(oauth_token === undefined) {
              res.send('failed...');
              console.log('bad oauth_token');
              return;
            }
            bmSession.secret = oauth_token_secret;
            redirect_url.query = {
              oauth_token: oauth_token,
              api_key: config.bodymedia.api_key,
              oauth_callback: 'http://localhost:3030/register/bodymedia/'
            };
            res.redirect(url.format(redirect_url));
          }
        );
      }
      else if(bmSession.secret && req.query.oauth_token) {
        // Step Two
        console.log('getting access token');
        oauth.getOAuthAccessToken(req.query.oauth_token,
          bmSession.secret, accessTokenCallback);
      }
      else {
        res.send('how did you get here');
      }


      function accessTokenCallback(error, access_token,
          access_token_secret, results) {


        console.log('results:', results);

        if(error) {
          console.error('error in accessTokenCallback', JSON.stringify(error));
          res.send(500, 'error with accessTokenCallback');
        }
        else {
          bmSession.fitbit = {
            token: access_token,
            secret: access_token_secret
          };

          req.session.user = {
            'token': access_token,
            'secret': access_token_secret,
            'service': 'bodymedia'
          };
          res.redirect('/register/bodymedia');
        }
      }
    });
    app.post('/register/bodymedia', function(req, res) {
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
	}



  function bodymedia_get(oauth, user, uri) {
    var deferred = Q.defer();

    oauth.get('http://api.bodymedia.com/v2' + uri + '?api_key=' +
      config.bodymedia.api_key, user.token, user.secret,
        function(err, data, response) {
          if(err) {
            deferred.reject(err);
            return;
          }
          if(response.headers['content-type'] === 'application/json') {
            data = JSON.parse(data);
          }
          deferred.resolve(data);
      });

    return deferred.promise;
  }

  function bodymedia_oauth() {
    var cfg = config.bodymedia;

    return new OAuth.OAuth(
      api_endpoints.request_token_url,
      api_endpoints.access_token_url,
      cfg.api_key,
      cfg.secret,
      '1.0',
      null,
      'HMAC-SHA1',
      64,
      {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Accept-Locale': 'en_US',
        'Connection': 'close',
        'User-Agent': 'racker-tracker'
      }
    );
  }

	function fetch(user, start_date, end_date) {
		var deferred = Q.defer(),
      dates = [
        start_date.toString('yyyyMMdd'),
        end_date.toString('yyyyMMdd')
      ],
      steps_uri = ['/step/day'].concat(dates).join('/'),
      calories_uri = ['/burn/day'].concat(dates).join('/');


    Q.spread([
        bodymedia_get(oauth, user, steps_uri),
        bodymedia_get(oauth, user, calories_uri)
      ],
      function(steps, calories) {
        var calorieHash = {}, dayCalories;

        calories.days.forEach(function(day) {
          if(day.totalCalories !== 0) {
            calorieHash[day.date] = day.totalCalories;
          }
        });
        deferred.resolve(steps.days.map(function(day) {
          dayCalories = calorieHash[day.date] || 0;

          return {
            date: Date.parseExact(day.date, 'yyyyMMdd'),
            steps: day.totalSteps,
            calories: dayCalories
          };
        }));
      }, function(err) {
        if(err.statusCode === 401) {
          deferred.reject(new Error('unauthorized'));
        }
        deferred.reject(new Error('BodyMedia failed'));
      });

		return deferred.promise;
	}

	return {
    fetch: fetch,
    webhandler: webhandler
  };
};