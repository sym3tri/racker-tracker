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

var count = 0;
var user = {
  state: 0,
  oauth_token: null,
  secret: null
};
  app.get('/register/reset', function(req, res) {
    user.state = 0;
    user.token = null;
    user.secret = null;
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

    if(0 === user.state) {
      oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
          console.error("error in OAuthRequestToken: ", JSON.stringify(error));
        }
        else {
          console.log('requestoken results: ' + sys.inspect(results));
          user.secret = oauth_token_secret;
          user.state = 1;
          res.redirect(fitbit_config.authorize_url + "?oauth_token=" + oauth_token);
        }
      });
      return;
    }
    else if(1 === user.state) {
      console.log("oauth_token: "+req.query.oauth_token);
      oauth.getOAuthAccessToken(req.query.oauth_token, user.secret, req.query.oauth_verifier, accessTokenCallback);
      return;
    }
    count++;
    res.render('register/fitbit', {
      title: 'Test Fitbit',
      count: count,
      message: message
    });

    function accessTokenCallback(error, access_token, access_token_secret, results) {
      if(error) {
        message = "error in accessTokenCallback" + JSON.stringify(error);
      }
      else {
        user.token = access_token;
        user.secret = access_token_secret;
        message = "everything is good: " + JSON.stringify({
          access_token: access_token,
          access_token_secret: access_token_secret,
          results: results
        });
        res.redirect("/register/fitbit-profile");
      }
      res.render('register/fitbit', {
        title: 'Test Fitbit',
        count: count,
        message: message
      });
    }
  });
  app.get('/register/fitbit-profile', function(req, res) {
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
    oauth.get(ENDPOINTS.fitbit.base + ENDPOINTS.fitbit.profile,// + '?' + querystring.stringify(params),
      user.token, user.secret, function(error, data, response) {

        if(error) {
          message = JSON.stringify(error);
        }
        else {
          message = JSON.stringify(data);
        }
        res.render('register/fitbit', {
          title: 'Test Fitbit',
          count: count,
          message: message
        });
      }
    );
  });


  app.get('/users', function(req, res) {

    app.get('sequelize')
    .query("SELECT * FROM Users").success(function(userRows) {

      console.log(userRows);

      res.render('users', {
        title: 'User List',
        users: userRows
      });

    });

  });

};

module.exports = routes;
