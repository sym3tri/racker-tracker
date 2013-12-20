'use strict';

var express = require('express'),
  http = require('http'),
  path = require('path'),
  app = module.exports = express(),
  config = require('./config-loader');

// all environments
app.set('config', config);
app.set('port', config.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
//app.set('layout', 'layout');
app.engine('hjs', require('hogan-express'));
app.set('db', require('./models')(config));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

require('./routes')(app);
app.use(app.router);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
