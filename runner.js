'use strict';

var fs = require('fs'),
    util = require('./util'),
    config = require('./config-loader'),
    models = require('./models')(config).models;

require('datejs');

function toSqlDate(date) {
  return date.getUTCFullYear() + '-' +
    util.pad(date.getUTCMonth()+1) + '-' +
    util.pad(date.getUTCDate()) + ' ' +
    util.pad(date.getUTCHours()) + ':' +
    util.pad(date.getUTCMinutes()) + ':' +
    util.pad(date.getUTCSeconds());
}


require('./modules')(config)
.then(function(modules) {
  var User = models.User,
      Stats = models.Stats,
      default_start_date = Date.today().addDays(-30),
      end_date = Date.today();

  User.findAll({
    where: {
      active: true
    }
  }).success(function(users) {
    if(!users) {
      return;
    }
    users.forEach(function(user) {
      if(!user.service) {
        return;
      }
      Stats.find({
        'where': {'userid': user.id },
        'order': 'date DESC'
      })
      .success(function(latest_stat) {
        var start_date;
        if(latest_stat) {
          start_date = latest_stat.date;
        } else {
          start_date = default_start_date.clone();
        }

        console.log('calling fetch: start:',
          start_date, 'end:', end_date, 'user', user.id);

        modules[user.service].fetch(user, start_date, end_date)
        .then(function(days) {
          console.log('days', days);
          days.forEach(function(day) {
            Stats.find({
              'where': {
                'userid': user.id,
                'date': toSqlDate(day.date)
              }
            })
            .success(function(stat) {
              if(!stat) {
                stat = Stats.build({
                  'userid': user.id,
                  'date': day.date
                });
              }
              stat.calories = day.calories;
              stat.steps = day.steps;
              stat.save();
            });
          });
        }, function(error) {
          if(error.message === 'unauthorized') {
            console.error('unauthorized user', user.id, user.email,
              ' marking as inactive');
            user.active = false;
            user.save();
          }
          else {
            console.log('unkown error (', user.id, user.email, ')', error);
          }
        });
      });
    });
  });
});
