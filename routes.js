var request = require('request'),
  OAuth = require('oauth'),
  sys = require('sys'),
  fs = require('fs');

var ENDPOINTS = {
  nike: {
    base: 'https://api.nike.com/',
    list: 'me/sport/activities/'
  },
  fitbit: {
    base: 'https://api.fitbit.com/1/',
    list: '',
    profile: 'user/-/profile.json',
    subscriber_endpoint: 'http://208.80.64.132:3000/fitbit/subscriber'
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
      {
        "User-Agent": "racker-tracker"
      }
    );
  }

  app.get('/register/fitbit-profile', function(req, res) {
    res.render('register/fitbit', {
      title: 'Test Fitbit',
      message: "thanks"
    });
  });

  function get_activity(token_id, date) {
    var Token = app.get('models').Token;
    var Stats = app.get('models').Stats;

    Token.find(token_id).success(function(token) {
      if(!token) {
        return false;
      }
      var oauth = fitbit_oauth();
      oauth.get(ENDPOINTS.fitbit.base + "user/-/activities/date/"+date+".json",
        token.token, token.secret, function(error, data, response) {
          if(error) {
            return false;
          }
          else {
            data = JSON.parse(data);
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
            });
          }
          return true;
        }
      );

    });
  }

  app.get('/fitbit/subscribe', function(req, res) {
    var token_id = 2;

    var Token = app.get('models').Token;

    Token.find(token_id).success(function(token) {
      if(!token) {
        res.redirect("/register/fitbit");
      }
      var oauth = fitbit_oauth();
      oauth.post(ENDPOINTS.fitbit.base+"user/-/activities/apiSubscriptions/"+token_id+".json",
        token.token, token.secret, '', function(error, data, response) {
          res.send();
          if(error) {
            console.error("error: " + JSON.stringify(error));
          }
          else {
            console.log("data: ", data);
          }
        });
    });
  });

  // This is called by fitbit when there are updates to stats
  // This in turn calls the fitbit api to get the data
  app.post('/fitbit/subscriber', function(req, res) {
    res.send(204);
    console.log("X-Fitbit-Signature: "+ req.get("X-Fitbit-Signature"));
    // console.log("files: ",req.files.updates);
    var update = req.files.updates;
    console.log("path:", update.path);
    console.log("content type:", update.mime);
    fs.readFile(update.path, function(error, data) {
      if(error) {
        console.error("unable to read", update.path);
      }
      else {
        data = JSON.parse(data);
        console.log("data",data);
        data.forEach(function(day) {
          console.log("updating:", day.subscriptionId, day.date);
          get_activity(day.subscriptionId, day.date);
        });
      }
      fs.unlink(update.path, function(error) {
        if(error) {
          console.error("unlinking", update.path, "failed");
        }
      });
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
