var express = require('express'),
  http = require('http'),
  path = require('path'),
  fs = require('fs'),
  _ = require('underscore'),
  app = module.exports = express(),
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')),
  localConfig,
  routes;

if (fs.existsSync(path.join(__dirname, 'config.local.json'))) {
  localConfig =
    JSON.parse(fs.readFileSync(path.join(__dirname, 'config.local.json'), 'utf8'));
  _.extend(config, localConfig);
  console.log('using local config overrides');
}

// all environments
app.set('config', config);
app.set('port', config.port || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.set('layout', 'layout');
app.engine('hjs', require('hogan-express'));
app.set('db', require('./models')(config));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

routes = require('./routes')(app);

require('./modules')(config, app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
