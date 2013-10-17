var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')),
    localConfig;

if (fs.existsSync(path.join(__dirname, 'config.local.json'))) {
  localConfig =
    JSON.parse(fs.readFileSync(path.join(__dirname, 'config.local.json'), 'utf8'));
  _.extend(config, localConfig);
  console.log('using local config overrides');
}

module.exports = config;
