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

  app.post('/login', function(req, res) {
    console.log(req.body);

    var User = app.get('models').User;
    //var user = User.build({
      //email: req.body.email,
      //firstname: req.body.firstname,
      //lastname: req.body.lastname,
      //service: req.body.service,
      //token: req.body.token
    //});

    User.find({ where: { email: req.body.email } })
      .success(function(user) {
        console.log(user);
      });

    user.save()
      .error(function(e) {
        console.log('DB ERROR!!!');
        console.log(e);
        res.send('ERROR: ' + e.code);
      })
      .success(function() {
        console.log('SAVE OK!!!');
        res.send('it worked! thanks ' + req.body.firstname);
      });

    // retrieve token

    // save token in DB
  });

  app.get('/login', function(req, res){
    res.render('login', { title: 'Login' });
  });

};

module.exports = routes;
