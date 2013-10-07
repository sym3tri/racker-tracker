var request = require('request'),
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

  app.get('/register', function(req, res){
    res.render('register', { title: 'Register' });
  });

  app.get('/about', function(req, res){
    res.render('about', { title: 'About' });
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
