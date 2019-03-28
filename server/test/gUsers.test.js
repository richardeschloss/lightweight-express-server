/* Requires */
const _ = require('lodash');
const async = require('async');
const { config } = require('../config.js');
const { assert } = require('chai');
const { request } = require('../utils/requester')
const { waitForServerStart, waitForServerStop } = require('../utils/test')

/* Constants */
const serverCfg = config.appServer;
const reqOptions = _.pick(serverCfg, ['proto', 'hostname', 'port']);

/* Test Setup */
before(waitForServerStart)

/* Test Cases */
describe('Google:gUsers Module', function(){
    it('shall retrieve the Google clientID for the app', (done) => {
			reqOptions.path = `/google/gUsers/auth/getClientID`
      request(reqOptions, {}, { returnJSON: true })
      .then((json) => {
        assert(json.CLIENT_ID)
        done()
      })
      .catch(done)
    })
})

/* Test Cleanup */
after(waitForServerStop)
