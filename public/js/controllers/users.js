'use strict';

var TrackerApp = angular.module('TrackerApp');
TrackerApp.controller('UsersCtrl', function($scope, $http, $location, uris) {

  // default inital state.
  $scope.users = null;
  if ($location.search().since) {
    $scope.since = $location.search().since;
  } else {
    $scope.since = 'week';
  }

  $scope.formatNumber = function(val) {
    return humanize.numberFormat(val, 0);
  };

  $scope.$watch('since', function fetchUsers(since) {
    $scope.state = 'loading...';
    $location.search('since', since);
    $http({
      method: 'GET',
      url: uris.users,
      params: { since: since }
    })
    .success(function(data) {
      $scope.users = data.users;
      $scope.state = '';
    })
    .error(function(data) {
      $scope.state = 'Error loading data. Try refreshing.';
    });
  });

});
