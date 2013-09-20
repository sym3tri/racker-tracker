var fs = require("fs");

function modules(app) {
	console.log("loading modules");
	var directory = "./modules/";
	fs.readdir(directory, function(err, files) {
		if(err) {
			console.error("Skipping modiles:", err);
			return;
		}
		files.forEach(function(file) {
			console.log("loading module:", file);
			require(directory + file)(app);
		});
	})
}

module.exports = modules;