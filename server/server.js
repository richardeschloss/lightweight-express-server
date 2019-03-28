/* Requires */
// const argv = require('minimist')(process.argv.slice(2))
const bodyParser = require('body-parser');
const debug = require('debug')('server');
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const logger = require('morgan');
// const { MongoStorage } = require('./utils/storage');
const passport = require('passport')
const path = require('path');
const securityUtils = require('./utils/security');
const serveStatic = require('serve-static');
const session = require("express-session");
const spdy = require('spdy');

const config = require('./config.js')
const db = require('./db.js');

const serverOptions = {
    proto: config.appServer.proto || 'https',
    host: config.appServer.host || 'localhost',
    port: config.appServer.port || 8080
}

// console.log('serverOptions:\r\n', serverOptions)

/* Globals */
app = express(); // Instantiate the express app

/* Constants */
const serverProps = [
	{ name: 'proto', default: 'http' },
	{ name: 'host', default: 'localhost' },
	{ name: 'port', default: '8080' },
	{ name: 'browser' },
]

/* Variables */
// const server; // Constant?
class AppServer{
	constructor(cfg){
		serverProps.forEach((prop) => {
			this[prop.name] = cfg[prop.name] || serverProps[prop.default]
		})
		this.protoStr = this.proto;
		if( this.protoStr == 'http2' ) this.protoStr = 'https';
		this.buildConnectionURI();
		this.createServer();
	}

	buildConnectionURI(){
		this.url = `${this.protoStr}://${this.host}:${this.port}`;
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
		        options.rejectUnauthorized: false // For dev only!
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

		if( this.browser && appServer.config.supportedBrowsers.includes(this.browser) ){
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
		this.server
		.listen(this.port, this.host)
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
			if( exports.serverListening ){
				exports.serverListening();
				exports.stop = function(){
					console.log('close server...')
					server.close();
				}
			}
			var addr = server.address();
			var bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port;
			debug('Listening on ' + bind);
		});

		if( app.get('env') === 'development' ){
			// If you want to watch for file changes, install nodemon or chokidar-socket-emitter (or your favorite watcher)
			// and uncomment this line: (probably only want to do in dev mode...)
			// require('chokidar-socket-emitter')({app: server})
		}
	}

	stop(){
		if( !this.server ) return;
		this.server.close();
	}
}

exports.AppServer = AppServer;

/* Constants */
// const createServer = {
//     'http': () => {
//         server = http.createServer(app);
//     },
//     'http2': () => { // spdy (requires cert)
//         // Using self-signed cert here (only do in dev mode!...never deploy!)
//         // Remember to import the cert into your browser so that it trusts it
//         // (question: do you trust yourself localhost?)
//         var options = {}
//         var keys = securityUtils.loadSelfSignedCert()
//         if( keys.err ){
//             console.log('Error loading cert', keys.err)
//             return;
//         }
//         options.key = keys.key;
//         options.cert = keys.cert;
//         server = spdy.createServer(options, app);
//     },
//     'https': () => {
//         // Using self-signed cert here (only do in dev mode!...never deploy!)
//         // Remember to import the cert into your browser so that it trusts it
//         // (question: do you trust yourself localhost?)
//         var options = {
//             requestCert: true,
//             rejectUnauthorized: false
//         };
//         var keys = securityUtils.loadSelfSignedCert()
//         if( keys.err ){
//             console.log('Error loading cert', keys.err)
//             return;
//         }
//         options.key = keys.key;
//         options.cert = keys.cert;
//         options.ca = [keys.cert];
//         server = https.createServer(options, app);
//     }
// }
// const mongoStorage = new MongoStorage();

/* Methods */
// function serverCreated(){
//     server
//     .listen(serverOptions.port, serverOptions.host)
//     .on('error', (error) => {
//         if (error.syscall !== 'listen') {
//             throw error;
//         }
//
//         var bind = typeof serverOptions.port === 'string'
//             ? 'Pipe ' + serverOptions.port
//             : 'Port ' + serverOptions.port;
//
//         // handle specific listen errors with friendly messages
//         switch (error.code) {
//             case 'EACCES':
//                 console.error(bind + ' requires elevated privileges');
//                 process.exit(1);
//                 break;
//             case 'EADDRINUSE':
//                 console.error(bind + ' is already in use');
//                 process.exit(1);
//                 break;
//             default:
//                 throw error;
//         }
//     })
//     .on('listening', () => {
//         if( exports.serverListening ){
//             exports.serverListening();
//             exports.stop = function(){
//                 console.log('close server...')
//                 server.close();
//             }
//         }
//         var addr = server.address();
//         var bind = typeof addr === 'string'
//             ? 'pipe ' + addr
//             : 'port ' + addr.port;
//         debug('Listening on ' + bind);
//         if( serverOptions.browser && supportedBrowsers.includes(serverOptions.browser) ){
//             const spawn = require('child_process').spawn;
//             var urlStart = `${serverOptions.proto == 'http2' ? 'https' : serverOptions.proto}://${serverOptions.host}:${serverOptions.port}`
//             spawn(serverOptions.browser, [urlStart])
//             console.log('opened', serverOptions.browser)
//             console.log('starting in', urlStart)
//         }
//     });
//
//     if( app.get('env') === 'development' ){
//         // If you want to watch for file changes, install nodemon or chokidar-socket-emitter (or your favorite watcher)
//         // and uncomment this line: (probably only want to do in dev mode...)
//         // require('chokidar-socket-emitter')({app: server})
//     }
// }
//
// function setCustomCacheControl(res, reqPath){
//     var regEx = new RegExp(/node_modules/) // Define the reg ex
//     if( reqPath.match(regEx) != null ){
//         res.setHeader('Cache-Control', 'public, max-age=60') // cache dependencies in the browser for [60] seconds
//     }
// }

/* Config */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* Static paths */
app.use(serveStatic(path.resolve('node_modules'), {
    maxAge: '1d' // Cache node_modules that are used in the browser
}))
// app.use(serveStatic(path.resolve('public'), { // front-end usually goes in "public" folder
//     setHeaders: setCustomCacheControl // optional
// }))

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

console.log('process.argv', process.argv)

/* Start server */
// createServer[serverOptions.proto]();
// if( server ) serverCreated();

// /* Connect to DB */
// mongoStorage
// .connect()
// .then((resp) => {
//     console.log(resp)
//     if( exports.mongoConnected ) {
//         exports.mongoConnected();
//         exports.disconnectMongo = function(){
//             console.log('disconnect mongo...')
//             mongoStorage.disconnect()
//         }
//     }
// })
// .catch(console.error)
