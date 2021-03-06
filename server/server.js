/* Requires */
const bodyParser = require('body-parser');
const debug = require('debug')('server');
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const logger = require('morgan');
const passport = require('passport')
const path = require('path');
const securityUtils = require('./utils/security');
const serveStatic = require('serve-static');
const session = require("express-session");
const spdy = require('spdy');

const { config } = require('./config.js')
const db = require('./db.js');

/* Globals */
app = express(); // Instantiate the express app

/* Constants */
const env = app.get('env');

const serverProps = [
  { name: 'proto', default: 'https' },
  { name: 'hostname', default: 'localhost' },
  { name: 'port', default: '8080' },
  { name: 'browser' },
];

/* Classes */
class AppServer{
  constructor(cfg){
    serverProps.forEach((prop) => {
      this[prop.name] = cfg[prop.name] || prop.default
    })
    this.frontend_root = cfg.frontend_root || config.appServer.frontend_root;

    this.protoStr = this.proto;
    if( this.protoStr == 'http2' ) this.protoStr = 'https';
    this.buildConnectionURI();
    this.configureApp();
    this.createServer();
  }

  buildConnectionURI(){
    this.url = `${this.protoStr}://${this.hostname}:${this.port}`;
  }

  configureApp(){
    /* Config */
    app.use(logger(env == 'production' ? 'tiny' : 'dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    /* Static paths */
    console.log('serve front end', this.frontend_root)
    app.use(serveStatic(this.frontend_root, { // front-end usually goes in "public" folder
      setHeaders: (req, reqPath) => { // optional
        // Define the reg ex (2019, probably not using either of these now)
        // var regEx = new RegExp(/jspm_packages|bower_components/)
        // if( reqPath.match(regEx) != null ){
        //     res.setHeader('Cache-Control', 'public, max-age=60') // cache dependencies in the browser for [60] seconds
        // }
      }
    }))

    // node_modules may be found in more than one place...
    app.use(serveStatic(path.resolve(config.appServer.frontend_root, 'node_modules'), {
      // Front end may separately have it's own deps it manages (i.e., if front end is someplace else)
      maxAge: '1d' // Cache node_modules that are used in the browser
    }))

    app.use(serveStatic(path.resolve('node_modules'), {
      maxAge: '1d' // Cache node_modules that are used in the browser
    }))

    /* Passport Session Config */
    app.use(session(config.expressSession));
    app.use(passport.initialize());
    app.use(passport.session());

    /* Routes */
    if( ['https', 'http2'].includes(this.proto) ){
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
  }

  createServer(){
    const createServer = {
      'http': (options) => {
        return http.createServer(app);
      },
      'https': (options) => {
        var keys = securityUtils.loadSelfSignedCert()
        if( keys.err ){
          console.log('Error loading cert', keys.err)
          return;
        }
        options.requestCert = true;
        options.rejectUnauthorized = false // For dev only!
        options.key = keys.key;
        options.cert = keys.cert;
        options.ca = [keys.cert];
        return https.createServer(options, app);
      },
      'http2': (options) => {
        var keys = securityUtils.loadSelfSignedCert()
        if( keys.err ){
          console.log('Error loading cert', keys.err)
          return;
        }
        options.key = keys.key;
        options.cert = keys.cert;
        return spdy.createServer(options, app);
      }
    }
    this.server = createServer[this.proto]({});
  }

  openBrowser(browser){
    this.browser = browser || this.browser;
    if( !this.browser ) return;

    if( this.browser && config.appServer.supportedBrowsers.includes(this.browser) ){
      const spawn = require('child_process').spawn;
      spawn(this.browser, [this.url])
      console.log('opened', this.browser)
      console.log('starting in', this.url)
    }
  }

  restart(){
    if( !this.server ) return;
    this.server.stop();
    this.server.start();
  }

  start(){
    if( !this.server ) return;
    db.connect().then(() => {
      if( this['dbConnected'] ) this['dbConnected']();
    }).catch(console.error);
    this.server
    .listen(this.port, this.hostname)
    .on('error', (error) => {
      if( this['serverError'] ){
        this['serverError'](error);
        // return;
      }
      if (error.syscall !== 'listen') {
        throw error;
      }

      var bind = typeof this.port === 'string'
        ? 'Pipe ' + this.port
        : 'Port ' + this.port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          // process.exit(1);
          break;
        case 'EADDRNOTAVAIL':
          console.error('address is unavailable...server may have already been started')
          break;
        default:
          throw error;
      }
    })
    .on('listening', () => {
      if( this['serverListening'] ) this['serverListening']();
      var addr = this.server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      debug('Listening on ' + bind);
    });

    if( app.get('env') === 'development' ){
      // If you want to watch for file changes, install nodemon or chokidar-socket-emitter (or your favorite watcher)
      // and uncomment this line: (probably only want to do in dev mode...)
      // require('chokidar-socket-emitter')({app: server})
      // Then the front end would need to listen to this socket emitter (see public/index.html)
    }
  }

  stop(){
    if( !this.server ) return;
    this.server.close();
    db.disconnect().then(console.log);
  }
}

/* Start */
if( require.main === module ){
  // We don't want external code, such as server-cli.js, to run this code. Only run
  // if this module is main (i.e., if we're running node server.js)
  const serverCfg = {
      proto: config.appServer.proto || 'https',
      hostname: config.appServer.hostname || 'localhost',
      port: config.appServer.port || 8080
  }
  const appServer = new AppServer(serverCfg);
  appServer.start();

  console.log('serverCfg:\r\n', serverCfg)
  console.log('URL:', appServer.url)
}

/* Exports */
exports.AppServer = AppServer;
