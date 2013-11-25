'use strict';

var TrackerApp = angular.module('TrackerApp');
TrackerApp.controller('UsersCtrl', function($scope, $http, uris) {

  $scope.users = null;
  $scope.since = null;
  $scope.state = 'loading...';
  $http({
    method: 'GET',
    url: uris.users
  })
  .success(function(data) {
    $scope.users = data.users;
    $scope.since = data.since;
  })
  .error(function(data) {
    $scope.state = 'Error loading data. Try refreshing.';
  });

});
