/* Requires */
const async = require('async');
const { AppServer } = require('../server.js');
const { config } = require('../config.js');

const appServer = new AppServer(config.appServer);

exports.waitForServerStart = function(done){
  if( config.tests && config.tests.startServer ){
    console.log("Waiting for server to start...")
    appServer.start();
    var events = [
      'dbConnected',
      'serverListening'
    ]

    async.each(events, (evt, callback) => {
      appServer[evt] = callback;
    }, (err) => {
      done();
    })

    appServer.serverError = (err) => {
      events.forEach((evt) => appServer[evt] = null)
      done();
    }

  } else {
    done();
  }
}

exports.waitForServerStop = function(done){
  if( config.tests && config.tests.startServer ){
    console.log("Waiting for server to stop...")
    appServer.stop();
  }
  done();
}
