var fs = require('fs'),
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8')),
    models = require('./models')(config).models;

require('datejs');

function pad(s) {
  return s < 10 ? '0' + s : s;
}

function toSqlDate(date) {
  return date.getUTCFullYear() + '-' +
    pad(date.getUTCMonth()+1) + '-' +
    pad(date.getUTCDate()) + ' ' +
    pad(date.getUTCHours()) + ':' +
    pad(date.getUTCMinutes()) + ':' +
    pad(date.getUTCSeconds());
}


require('./modules')(config)
.then(function(modules) {
  var User = models.User,
      Stats = models.Stats;

  var end_date = Date.today();

  User.findAll().success(function(users) {
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
        var start_date = Date.today().addDays(-7);

        if(latest_stat) {
          start_date = latest_stat.date;
        }

        console.log('calling fetch: start:', start_date, 'end:', end_date, 'user', user.id);
        modules[user.service].fetch(user, start_date, end_date)
          .then(function(days) {
            days.forEach(function(day) {
              try {
              Stats.find({ 'where': {
                'userid': user.id,
                'date': toSqlDate(day.date)
              }})
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
              } catch(e) {
                console.error('error caught:', e, e.lineNumber);
              }
            });
          });
      });
    });
  });
});
