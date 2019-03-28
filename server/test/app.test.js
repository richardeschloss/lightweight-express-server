/* Requires */
const _ = require('lodash');
const { config } = require('../config.js');
const { assert } = require('chai');
const async = require('async');
const q = require('q');
const { request } = require('../utils/requester')
const { waitForServerStart, waitForServerStop } = require('../utils/test')

/* Constants */
const serverCfg = config.appServer;
const reqOptions = _.pick(serverCfg, ['proto', 'hostname', 'port']);

console.log('=== Start of TEST: serverCfg', serverCfg)

before(waitForServerStart)

describe('App Module', function(){
  describe('App Routes', function(){
    it('[/]: should return index.html', function(done){
      reqOptions.path = '/';
      request(reqOptions)
      .then((resp) => {
        var match = resp.match('<title>Hello app</title>');
        assert(match)
        done();
      })
      .catch(done);
    })

    it('[/app/getDummyInfo]: should return dummy info', function(done){
      reqOptions.path = '/app/getDummyInfo';
      request(reqOptions, {}, { returnJSON: true })
      .then((json) => {
        assert(json.info == 1234);
        done();
      })
      .catch(done)
    })

    it('[/app/getSessionInfo]: should return session info', function(done){
      reqOptions.path = '/app/getSessionInfo';
      request(reqOptions, {}, { returnJSON: true })
      .then((json) => {
        assert(json.viewCnt == 1);
        assert(json.msg == "Welcome to this page for the first time!");
        done();
      })
      .catch(done)
    })

    // More tests to follow...
  })
})

after(waitForServerStop)
