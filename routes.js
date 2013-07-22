var request = require('request'),
  OAuth = require('oauth'),
  sys = require('sys');

var ENDPOINTS = {
  nike: {
    base: 'https://api.nike.com/',
    list: 'me/sport/activities/'
  },
  fitbit: {
    base: 'https://api.fitbit.com/1/',
    list: '',
    profile: 'user/-/profile.json'
  }
};


/*
 * GET home page.
 */


var routes = function(app) {

  app.get('/', function(req, res) {
    res.render('index', { title: 'Racker Tracker' });
  });

  app.post('/register', function(req, res) {
    console.log(req.body);

    var User = app.get('models').User;

    var userValues = {
      email: req.body.email,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      service: req.body.service,
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

  app.get('/register', function(req, res){
    res.render('register', { title: 'Register' });
  });

  app.get('/register/reset', function(req, res) {
    req.session.fitbit = {};
    res.redirect("/register/fitbit");
  });
  app.get('/register/fitbit', function(req, res) {
    var message = "none";
    var fitbit_config = app.get('config').fitbit;

    var oauth = new OAuth.OAuth(
      fitbit_config.request_token_url,
      fitbit_config.access_token_url,
      fitbit_config.consumer_key,
      fitbit_config.consumer_secret,
      "1.0",
      null,
      "HMAC-SHA1",
      {
        "User-Agent": "racker-tracker"
      }
    );
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
        }
        var User = app.get('models').User;
        var Token = app.get('models').Token;
        User.find(1).success(function(user) {
          var token = Token.build({
            service: 'fitbit',
            token: access_token,
            secret: access_token_secret,
            userid: user.id
          });
          token.save();
        });
        res.redirect("/register/fitbit-profile");
        return;
      }
      res.render('register/fitbit', {
        title: 'Test Fitbit',
        message: message
      });
    }
  });

  app.get('/register/fitbit-profile', function(req, res) {
    var Token = app.get('models').Token;
    var Stats = app.get('models').Stats;
    var fitbit_config = app.get('config').fitbit;

    Token.find(2).success(function(token) {
      if(!token) {
        res.redirect("/register/fitbit");
      }
      var oauth = new OAuth.OAuth(
        fitbit_config.request_token_url,
        fitbit_config.access_token_url,
        fitbit_config.consumer_key,
        fitbit_config.consumer_secret,
        "1.0",
        null,
        "HMAC-SHA1",
        {
          "User-Agent": "racker-tracker"
        }
      );
      var date = "2013-07-20";
      oauth.get(ENDPOINTS.fitbit.base + "user/-/activities/date/"+date+".json",
        token.token, token.secret, function(error, data, response) {
          if(error) {
            message = "error: " + JSON.stringify(error);
          }
          else {
            data = JSON.parse(data);
            message = JSON.stringify(data);
            console.log(data.summary);

            var userid = 1;
            Stats.find({ where: {
              date: date,
              userid: userid
            }}).success(function(stat) {
              console.log("adding data");
              if(!stat) {
                stat = Stats.build({
                  date: date,
                  userid: userid
                });
              }
              stat.updateAttributes({
                calories: data.summary.caloriesOut,
                steps: data.summary.steps
              });
//              stat.save();
            });
          }

          res.render('register/fitbit', {
            title: 'Test Fitbit',
            message: message
          });

        }
      );

    });
  });


  app.get('/users', function(req, res) {

    var User = app.get('models').User;
    User.findAll().success(function(users) {

      console.log(users);

      res.render('users', {
        title: 'User List',
        users: users
      });

    });

  });

};

module.exports = routes;
