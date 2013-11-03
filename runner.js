'use strict';

var optimist = require('optimist'),
  util = require('./util'),
  config = require('./config-loader'),
  models = require('./models')(config).models,
  User = models.User,
  Stats = models.Stats,
  options = optimist
    .alias('h', 'help')
    .alias('s', 'start')
    .alias('e', 'end')
    .default({
      start: Date.today().addDays(-30),
      end: Date.today(),
      force: false
    })
    .usage('$0\nFetchs stats for all active users\n\ntimes parsed by datejs')
    .describe('help', 'output this')
    .describe('start', 'start time')
    .describe('end', 'end time')
    .describe('force', 'refetch data for users'),
  argv = options.argv;

require('datejs');


if(!(argv.start instanceof Date)) {
  argv.start = Date.parse(argv.start);
  argv.force = true;
}

if(!(argv.end instanceof Date)) {
  argv.end = Date.parse(argv.end);
  argv.force = true;
}

if(argv.help || !argv.start || !argv.end) {
  options.showHelp();
  process.exit();
}

function fetch(user, service, start_date, end_date) {
  console.log('calling fetch: start:',
    start_date, 'end:', end_date, 'user', user.id);

  service.fetch(user, start_date, end_date)
  .then(function(days) {
    console.log('days', days);
    days.forEach(function(day) {
      Stats.find({
        'where': {
          'userid': user.id,
          'date': util.toSqlDate(day.date)
        }
      })
      .success(function(stat) {
        if(!stat) {
          stat = Stats.build({
            'userid': user.id,
            'date': day.date
          });
        }
        else {
          // don't update unless the data is new
          if(stat.calories === day.calories && stat.steps === day.steps) {
            return;
          }
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
}


require('./modules')(config)
.then(function(modules) {

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

      if(argv.force) {
        fetch(user, modules[user.service], argv.start, argv.end);
      }
      else {
        Stats.find({
          'where': {'userid': user.id },
          'order': 'date DESC'
        })
        .success(function(latest_stat) {
          var start_date;
          if(latest_stat) {
            start_date = latest_stat.date;
          } else {
            start_date = argv.start.clone();
          }

          fetch(user, modules[user.service], start_date, argv.end);
        });
      }
    });
  });
});
