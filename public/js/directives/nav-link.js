'use strict';

angular.module('TrackerApp').directive('navLink', function($location, _) {

  return {
    templateUrl: '/views/directives/nav-link.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      // The path to link to.
      'href': '@',
      // Optionally reset search params. Default is true.
      'resetSearch': '@'
    },
    link: function postLink(scope, elem, attrs) {

      scope.isActive = function() {
        return $location.path() === scope.href;
      };

      scope.followLink = function() {
        if (scope.resetSearch) {
          $location.path(scope.href);
        } else {
          $location.url(scope.href);
        }
      };

    }
  };

});
