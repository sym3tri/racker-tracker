var request = require('request');
var ENDPOINTS = {
  nike: {
    base: 'https://api.nike.com/',
    list: 'me/sport/activities/'
  },
  fitbit: {
    base: '',
    list: ''
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
