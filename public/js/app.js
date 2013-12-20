'use strict';

var TrackerApp = angular.module('TrackerApp', [
  'ngRoute',
  'ngResource',
  'ui.bootstrap',
  'underscore'
]);

TrackerApp.constant('uris', {
  leaderBoard: '/api/leaders',
  users: '/api/users'
});

TrackerApp.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
    .when('/', {
      templateUrl: '/views/leader-board.html',
      controller: 'LeaderBoardCtrl',
    })
    .when('/login', {
      templateUrl: '/views/login.html',
      controller: 'LoginCtrl'
    })
    .when('/users', {
      templateUrl: '/views/users.html',
      controller: 'UsersCtrl',
      reloadOnSearch: false
    })
    .when('/user', {
      templateUrl: '/views/user.html',
      controller: 'UserCtrl'
    })
    .when('/about', {
      templateUrl: '/views/about.html'
    })
    .when('/register', {
      templateUrl: '/views/register.html'
    })
    .when('/register/complete', {
      templateUrl: '/views/register-complete.html'
    })
    .when('/register/nike', {
      templateUrl: '/views/register-nike.html'
    })
    .when('/register/fitbit', {
      templateUrl: '/views/register-fitbit.html'
    })
    .otherwise({
      templateUrl: '/views/404.html'
    });
});
