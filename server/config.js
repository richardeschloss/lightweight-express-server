exports.config = { // Shown just for dev purposes...This file should be ignored in docker and normal source control!
	"appServer": {
		"proto": process.env.SERVER_PROTO || "http",
		"hostname": process.env.SERVER_HOSTNAME || "localhost",
		"port": process.env.SERVER_PORT || "8080",
		"frontend_root": process.env.FRONTEND_ROOT || 'public',
		"server_root": process.env.MYAPPDIR || '.',
		"supportedBrowsers": [
			"chromium",
			"firefox"
		],
		"ssl": {
			key: process.env.SERVER_SSL_KEY || './.ssl/server.key',
			cert: process.env.SERVER_SSL_CERT || './.ssl/server.crt'
		}
	},
	"expressSession": {
	    "secret": "cats", // Secret should probably be stronger than this :)
	    "resave": false,
	    "saveUninitialized": false
	},
	"mongoClient": {
		  "dbHost": process.env.MONGOD_HOSTNAME || '127.0.0.1',
	    "dbName": process.env.MONGOD_DBNAME || "appData",
	    "connectOptions": {
	        "auth": { // Never reveal credentials to public! (just for example)
	            "user": process.env.MONGOD_USERNAME || "appUser",
	            "password": process.env.MONGOD_PASSWORD || "an apple falls on unsuspecting users"
	        },
	        "authSource": process.env.MONGOD_AUTHSOURCE || "appData_users",

					/* TLS/SSL options */
					"ssl": ( process.env.MONGOD_TLS_ENABLED == 'true' ) || false,
	        "sslKey": process.env.MONGOD_TLS_CLIENT_KEY || "./.ssl/mongoClient.key",
	        "sslCert": process.env.MONGOD_TLS_CLIENT_CERT || "./.ssl/mongoClient.crt",
	        "sslCA": process.env.MONGOD_TLS_SERVER_CERT || "./.mongod/mongod.pem",

					/* Reconnect options */
					reconnectTries: Number.MAX_VALUE,
					reconnectInterval: 500,
					connectTimeoutMS: 10000,

					/* To address deprecations: https://mongoosejs.com/docs/deprecations.html */
					useCreateIndex: true,
					useNewUrlParser: true,
					useFindAndModify: false
	    }
	},
	"tests": {
		// mocha tests will start the appServer ONLY if this is set to true. If this is set to false,
		// then it will be expected that the appServer will already be running
		startServer: ( process.env.TESTS_START_SERVER == 'true' ) || true
	}
}
