/* Requires */
const argv = require('minimist')(process.argv.slice(2))
const debug = require('debug')('server');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const securityUtils = require('./utils/security');
const serveStatic = require('serve-static');
const serverOptions = {
    proto: argv.proto || 'http',
    host: argv.host || 'localhost',
    port: argv.port || 8080,
    genSSL: argv.genSSL,
    browser: argv.browser
}

/* Globals */
app = express(); // Instantiate the express app

/* Variables */
var server;

/* Constants */
const createServer = {
    'http': () => {
        const http = require('http');
        server = http.createServer(app);
    },
    'http2': () => { // spdy (requires cert)
        const fs = require('fs')
        const spdy = require('spdy');
        // Using self-signed cert here (only do in dev mode!...never deploy!)
        // Remember to import the cert into your browser so that it trusts it
        // (question: do you trust yourself localhost?)
        var options = {}
        var keys = securityUtils.loadSelfSignedCert()
        if( keys.err ){
            console.log('Error loading cert', keys.err)
            return;
        }
        options.key = keys.key;
        options.cert = keys.cert;
        server = spdy.createServer(options, app);
    },
    'https': () => {
        const fs = require('fs')
        const https = require('https');
        // Using self-signed cert here (only do in dev mode!...never deploy!)
        // Remember to import the cert into your browser so that it trusts it
        // (question: do you trust yourself localhost?)
        var options = {}
        var keys = securityUtils.loadSelfSignedCert()
        if( keys.err ){
            console.log('Error loading cert', keys.err)
            return;
        }
        options.key = keys.key;
        options.cert = keys.cert;
        server = https.createServer(options, app);
    }
}
const supportedBrowsers = ['chromium', 'firefox', 'iceweasal'] // Tweak this list based on your app's requirements...

/* Methods */
function serverCreated(){
    server
    .listen(serverOptions.port, serverOptions.host)
    .on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    })
    .on('listening', () => {
        var addr = server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
        if( serverOptions.browser && supportedBrowsers.includes(serverOptions.browser) ){
            const spawn = require('child_process').spawn;
            var urlStart = `${serverOptions.proto == 'http2' ? 'https' : serverOptions.proto}://${serverOptions.host}:${serverOptions.port}`
            spawn(serverOptions.browser, [urlStart])
            console.log('opened', serverOptions.browser)
            console.log('starting in', urlStart)
        }
    });

    // If you want to watch for file changes, install chokidar-socket-emitter (or your favorite watcher)
    // and uncomment this line:
    // require('chokidar-socket-emitter')({app: server})
}

function setCustomCacheControl(res, reqPath){
    if( reqPath.match(/jspm_packages|bower_components/) != null ){
        res.setHeader('Cache-Control', 'public, max-age=60') // cache dependencies in the browser for [60] seconds
    }
}

/* Config */
app.use(logger('dev'));
app.use(serveStatic(path.join(__dirname, 'public'), {
    setHeaders: setCustomCacheControl // optional
}))

if( serverOptions.genSSL ){
    securityUtils.generateSelfSignedCert(() => {
        console.log('self-signed SSL cert created...')
        console.log(' Now you can restart the server with --https or --http2, but remember to omit --genSSL from the command so you do not keep re-generating the cert...')
    });
} else {
    createServer[serverOptions.proto]();
    if( server ) serverCreated();
}
