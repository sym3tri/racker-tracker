'use strict';

var url = require('url'),
	request = require('request'),
	Q = require('q'),
	util = require('../util');


module.exports = function(config) {
	function jawbone_request(user, options) {
		if(typeof options === 'string') {
			options = {url: options};
		}
    if(!options.headers) {
      options.headers = {};
    }
		options.headers.Authorization = 'Bearer '+user.token;
		return util.request(options);
	}


	function webhandler(app) {
    var User = app.get('db').models.User;
		app.get('/register/jawbone', function(req, res) {
			var auth_url,
				token_url,
        user;

			if(Object.keys(req.query).length === 0 &&
            req.session.user === undefined) {
				auth_url = url.parse(config.jawbone.auth_url);
				auth_url.query = {
					response_type: 'code',
					client_id: config.jawbone.client_id,
					scope: 'basic_read move_read',
					redirect_uri: 'http://' + req.headers.host +
						'/register/jawbone'
				};
				res.redirect(url.format(auth_url));
			}
			else if(req.query.code) {
				token_url = url.parse(config.jawbone.request_token_url);
				token_url.query = {
					client_id: config.jawbone.client_id,
					client_secret: config.jawbone.app_secret,
					grant_type: 'authorization_code',
					code: req.query.code
				};

				util.request(url.format(token_url))
          .then(function(data) {
            user = {
              token: data.access_token,
              service: 'jawbone'
            };

            return jawbone_request(user,
              'https://jawbone.com/nudge/api/v.1.0/users/@me');
          })
          .then(function(userInfo) {
            user.name = [userInfo.data.first, userInfo.data.last]
              .join(' ').trim();
            req.session.user = user;
            res.redirect('/register/jawbone');
          })
          .fail(function(error) {
            console.error('failed to register:', error);
            res.send('failed', error);
          });
			}
      else if(req.session.user) {
        res.render('register/jawbone', {
          title: 'Register with Jawbone',
          user: req.session.user
        });
      }
		});

    app.post('/register/jawbone', function(req, res) {
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


	function fetch(user, start_date, end_date) {
		var deferred = Q.defer(),
      move_url = url.parse('https://jawbone.com/nudge/api/users/@me/moves'),
			stats = [];

    move_url.query = {
      start_time: start_date.getTime(),
      end_time: end_date.getTime()
    };
    console.log(url.format(move_url));
    jawbone_request(user, {uri:move_url})
      .then(function(data) {
        console.log('data:', data);
        deferred.resolve(stats);
      });
		return deferred.promise;
	}

  return {
    fetch: fetch,
    webhandler: webhandler
  };
}