/* Requires */
const { assert } = require('chai');
const { request } = require('../utils/requester')

/* Test Setup */
before(function(done){
    var server = require('../server.js')
    server.serverListening = done;
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
after((done) => {
    process.exit();
})
