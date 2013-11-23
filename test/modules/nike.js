var nike = require('../../modules/nike')();

nike.fetch('authtoken', '2013-09-16', '2013-09-16')
  .then(function(result) {
    console.log(result);
  })
  .catch(function(err) {
    console.log(err);
  });


nike.login('email', 'password')
  .then(function(result) {
    console.log(result);
  })
  .catch(function(err) {
    console.log(err);
  });
