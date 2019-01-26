/* Requires */
const argv = require('minimist')(process.argv.slice(2))
const bodyParser = require('body-parser');
const debug = require('debug')('server');
const express = require('express');
const logger = require('morgan');
const passport = require('passport')
const path = require('path');
const securityUtils = require('./utils/security');
const serveStatic = require('serve-static');
const session = require("express-session");

const config = require('./config.json')
const serverOptions = {
    proto: argv.proto || 'https',
    host: argv.host || 'localhost',
    port: argv.port || 8080,
    browser: argv.browser
}

console.log('serverOptions:\r\n', serverOptions)

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
        var options = {

        }
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
        var options = {
            requestCert: true,
            rejectUnauthorized: false
        };
        var keys = securityUtils.loadSelfSignedCert()
        if( keys.err ){
            console.log('Error loading cert', keys.err)
            return;
        }
        options.key = keys.key;
        options.cert = keys.cert;
        options.ca = [keys.cert];
        server = https.createServer(options, app);
    }
}
const supportedBrowsers = ['chromium', 'firefox'] // Tweak this list based on your app's requirements...

/* Methods */
function serverCreated(){
    server
    .listen(serverOptions.port, serverOptions.host)
    .on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof serverOptions.port === 'string'
            ? 'Pipe ' + serverOptions.port
            : 'Port ' + serverOptions.port;

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
        if( exports.serverListening ) exports.serverListening();
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

    if( app.get('env') === 'development' ){
        // If you want to watch for file changes, install chokidar-socket-emitter (or your favorite watcher)
        // and uncomment this line: (probably only want to do in dev mode...)
        // require('chokidar-socket-emitter')({app: server})
    }
}

function setCustomCacheControl(res, reqPath){
    var regEx = new RegExp(/jspm_packages|bower_components/) // Define the reg ex
    if( reqPath.match(regEx) != null ){
        res.setHeader('Cache-Control', 'public, max-age=60') // cache dependencies in the browser for [60] seconds
    }
}

/* Config */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* Static paths */
app.use(serveStatic(path.resolve('node_modules'), {
    maxAge: '1d' // Cache node_modules that are used in the browser
}))
app.use(serveStatic(path.resolve('public'), { // front-end usually goes in "public" folder
    setHeaders: setCustomCacheControl // optional
}))

/* Passport Session Config */
app.use(session(config.expressSession));
app.use(passport.initialize());
app.use(passport.session());

/* Routes */
if( ['https', 'http2'].includes(serverOptions.proto) ){
    // Only support users routes if server is running a secure protocol
    app.use('/users', require('./modules/users/users.routes'));
    app.use('/google/gUsers', require('./modules/google/gUsers/gUsers.routes'));
}
app.use('/app', require('./routes/app.routes'))

app.use(function(err, req, res, next) {
    console.log('err occurred', err)
    if( err.msg == 'Unauthorized' ){
        return res.status(401).json({redirectTo: '/'})
    }

    res.json(err);
});

createServer[serverOptions.proto]();
if( server ) serverCreated();
