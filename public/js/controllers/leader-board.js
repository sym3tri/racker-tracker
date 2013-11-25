'use strict';

var TrackerApp = angular.module('TrackerApp');
TrackerApp.controller('LeaderBoardCtrl', function($scope, $http, uris) {

  $scope.state = 'loading...';
  $scope.thisWeeksSteps = null;
  $scope.lastWeeksSteps = null;
  $scope.mostImproved = null;

  $http({
    method: 'GET',
    url: uris.leaderBoard
  })
  .success(function(data) {
    $scope.thisWeeksSteps = data.thisWeeksSteps;
    $scope.lastWeeksSteps = data.lastWeeksSteps;
    $scope.mostImproved = data.mostImproved;
    $scope.state = '';
  })
  .error(function(data) {
    $scope.state = 'Error loading data. Try refreshing.';
  });

});
