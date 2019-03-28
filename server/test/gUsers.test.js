/* Requires */
const { AppServer } = require('../server.js');
const { assert } = require('chai');
const async = require('async');
const { request } = require('../utils/requester')

/* Constants */
const appServer = new AppServer({});

/* Test Setup */
before(function(done){
	appServer.start();
	var events = [
		'dbConnected',
		'serverListening'
    ]
	async.each(events, (evt, callback) => {
		appServer[evt] = callback;
	}, done)
})

/* Test Cases */
describe('Google:gUsers Module', function(){
    it('shall retrieve the Google clientID for the app', (done) => {
        request({path: `/google/gUsers/auth/getClientID`}, {}, { returnJSON: true })
        .then((json) => {
            assert(json.CLIENT_ID)
            done()
        })
        .catch(done)
    })
})

/* Test Cleanup */
after(function(){
	appServer.stop();
})
