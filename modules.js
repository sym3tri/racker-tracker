var fs = require("fs"),
  Q = require('Q');

function modules(config, app) {
  var deferred = Q.defer(),
    directory = "./modules/",
    modules = {};

  console.log("loading modules");
  fs.readdir(directory, function(err, files) {
    if(err) {
      console.error("Skipping modules:", err);
      deferred.reject('error loading modules');
      return;
    }
    files.forEach(function(file) {
      var module = require(directory + file)(config);
      modules[file.replace(/\.js$/, '')] = module;
      if(app && 'webhandler' in module) {
        console.log("loading module:", file);
        module.webhandler(app);
      }
    });
    deferred.resolve(modules);
  });
  return deferred.promise;
}

module.exports = modules;
