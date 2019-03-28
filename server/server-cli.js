#!/usr/bin/node
/* Requires */
const argv = require('minimist')(process.argv.slice(2));
const { AppServer } = require('./server.js');
const serverCfg = {
    proto: argv.proto || 'https',
    host: argv.host || 'localhost',
    port: argv.port || 8080,
    browser: argv.browser
}
// const supportedBrowsers = ['chromium', 'firefox'] // Tweak this list based on your app's requirements...

/* Start */
const appServer = new AppServer(serverCfg);
appServer.start();

console.log('server-cli running...', argv)
