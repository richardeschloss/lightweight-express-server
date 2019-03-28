#!/usr/bin/node
/* Requires */
const argv = require('minimist')(process.argv.slice(2));
const { AppServer } = require('./server.js');
const serverCfg = {
    proto: argv.proto || 'http',
    host: argv.host || 'localhost',
    port: argv.port || 8080,
    browser: argv.browser
}

/* Start */
const appServer = new AppServer(serverCfg);
appServer.start();

appServer.dbConnected = () => {
	console.log('DB dbConnected')
}

appServer.serverListening = () => {
	console.log('Server listening', appServer.url)
}
