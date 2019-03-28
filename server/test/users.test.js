/* Requires */
const _ = require('lodash');
const async = require('async');
const { config } = require('../config.js');
const { assert } = require('chai');
const q = require('q');
const { request } = require('../utils/requester')
const { waitForServerStart, waitForServerStop } = require('../utils/test')

/* Constants */
const serverCfg = config.appServer;
const reqOptions = _.pick(serverCfg, ['hostname', 'port', 'proto' ])
reqOptions.headers = {}

const userInfo = {
  username: 'test',
  password: 'test',
  firstName: 'Test',
  lastName: 'User'
}

var currentUser, diffUser;

/* Methods */
function authUser(info, returnOptions){
  const authRequestOptions = _.pick(reqOptions, ['hostname', 'port', 'proto', 'headers' ]);
  authRequestOptions.path = `/users/auth/local`;
  authRequestOptions.method = 'POST';
  return request(authRequestOptions, info, returnOptions)
  .progress((data) => {
    if( data.headers && data.headers['set-cookie'] ){
      reqOptions.headers.Cookie = data.headers['set-cookie']
    }
  })
}

function getCurrentUser(){
  const currentUserRequestOptions = _.pick(reqOptions, ['hostname', 'port', 'proto', 'headers' ])
  currentUserRequestOptions.path = `/users/secure/currentUser`;
  return request(currentUserRequestOptions, userInfo, { returnJSON: true});
}

function deleteUser(info){
  const deleteRequestOptions = _.pick(reqOptions, ['hostname', 'port', 'proto', 'headers' ])
  deleteRequestOptions.path = `/users/secure/delete`;
  deleteRequestOptions.method = 'POST';
  return request(deleteRequestOptions, info, { returnJSON: true});
}

function updateUser(info){
  const updateRequestOptions = _.pick(reqOptions, ['hostname', 'port', 'proto', 'headers' ])
  updateRequestOptions.path = `/users/secure/update`;
  updateRequestOptions.method = 'POST';
  return request(updateRequestOptions, info, { returnJSON: true});
}

/* Test Setup */
before(waitForServerStart)

/* Test Suite */
describe('Users Module', function(){
  describe('User Registration', function(){
    it('shall allow users to be added to the database', (done) => {
      reqOptions.path = '/users/register';
      reqOptions.method = 'POST';
      request(reqOptions, userInfo, { returnJSON: true })
      .then((json) => {
          userInfo.id = json.id;
          done(json.err);
      })
      .catch(done)
    })
  })

  describe('Authentication', function(){
    it('shall handle invalid username', (done) => {
      const badUserInfo = {
          username: 'abba',
          password: 'dabba'
      }
      authUser(badUserInfo, { returnJSON: true })
      .then((json) => {
        assert(json.err == 'invalidUser')
        done();
      })
      .catch(done);
    })

    it('shall handle invalid password', (done) => {
      const badPassInfo = {
          username: 'test',
          password: 'dabba'
      }
      authUser(badPassInfo, { returnJSON: true })
      .then((json) => {
          assert(json.err == 'invalidPass')
          done();
      })
      .catch(done);
    })

    it('shall allow users to be authenticated with username/password', (done) => {
      authUser(userInfo, {})
      .then((resp) => {
        assert(resp == 'Found. Redirecting to /app/app.html') // Successful login
        done();
      })
      .catch(done);
    })
  })

  describe('Secured Routes', function(){
    it('shall not allow current user info to be retrieved if not authenticated', function(done){
      getCurrentUser()
      .then((resp) => { done() })
      .catch((err) => {
        assert(err == 401)
        done()
      })
    })

    it('shall allow current user info, less password, to be retrieved if authenticated', function(done){
      authUser(userInfo, {})
      .then((getCurrentUser))
      .then((json) => {
        currentUser = json;
        assert(currentUser != undefined)
        assert(currentUser.password == undefined)
        assert(currentUser.passwordHash == undefined)
        done()
      })
      .catch(done)
    })

    it('shall NOT allow the current user info to be updated by a different user', function(done){
      diffUser = {
        id: '123-wrong-id',
        username: currentUser.username,
        password: currentUser.password
      }
      updateUser(diffUser)
      .then((json) => {
        assert(json.err == 'wrongUserId')
        done()
      }, done)
    })

    it('shall allow the current user info to be updated by the current user', function(done){
      currentUser.password = 'a really long password';
      currentUser.lastName = 'maidenName-givenName'
      updateUser(currentUser)
      .then((json) => {
        assert(json.msg == 'updated user successfully')
        done()
      }, done)
    })

    it('shall NOT allow the current user to be deleted by a different user', function(done){
      deleteUser(diffUser)
      .then((json) => {
        assert(json.err == 'wrongUserId' )
        done();
      }, done)
    })

    it('shall NOT allow the current user to be deleted if credentials are missing', function(done){
      deleteUser({id: currentUser.id})
      .then((json) => {
        assert(json.err == 'missingCredentials')
        done();
      }, done)
    })

    it('shall allow the current user to be deleted, if authenticated', function(done){
      deleteUser(currentUser)
      .then((json) => {
        assert(json.msg == 'succesfully deleted user ' + currentUser.id)
        done();
      }, done)
    })
  })
})

/* Test Cleanup */
after(waitForServerStop)
