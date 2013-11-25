'use strict';

var Fitbit = require('./modules/fitbit'),
    Nike = require('./modules/nike');

module.exports = function(app) {

  var nike = new Nike(app.get('config').nike, app),
      fitbit = new Fitbit(app.get('config').fitbit, app);

  /**
   * General API routes
   */
  app.get('/api/leaders', require('./api/leaders')(app));
  app.get('/api/users', require('./api/users')(app));


  /**
   * Device Module specific Routes
   */

  // Nike
  app.post('/api/register/nike', nike.postHandler.bind(nike));

  // Fitbit
  app.get('/oauth/fitbit', fitbit.getHandler.bind(fitbit));
  app.post('/api/register/fitbit', fitbit.postHandler.bind(fitbit));


  /**
   * Catch-all to always serve index.html for any non-matching routes.
   * Required for single-page-app-iness.
   */
  app.get('/*', function(req, res) {
    res.render('index', {});
  });

};
