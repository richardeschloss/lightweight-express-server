exports.config = {
	"appServer": {
		"proto": "https",
		"host": "localhost",
		"port": "8080",
		"supportedBrowsers": [
			"chromium",
			"firefox"
		]
	},
    "expressSession": {
        "secret": "cats", // Secret should probably be stronger than this :)
        "resave": false,
        "saveUninitialized": false
    },
    "mongoClient": {
        "dbName": "appData",
        "connectOptions": {
            "auth": {
                "user": "appUser",
                "password": "an apple falls on unsuspecting users"
            },
            "authSource": "appData_users",
            "ssl": true,
            "sslKey": "~/.ssl/mongoClient.key",
            "sslCert": "~/.ssl/mongoClient.crt",
            "sslCA": "/etc/ssl/mongo_dev/mongod.pem"


        }
    }
}
