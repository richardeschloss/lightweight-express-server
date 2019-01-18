/* Requires */
const assert = require('chai').assert;
const https = require('https');
const q = require('q');
const qStr = require('querystring');
const securityUtils = require('../utils/security')

/* Constants */
const keys = securityUtils.loadSelfSignedCert()
if( keys.err ){
    console.log('Error loading cert', keys.err)
    process.exit(1);
}

const httpsAgent = new https.Agent({
    keepAliveMsecs: 10000,
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: 256,
    key: keys.key,
    cert: keys.cert,
    ca: [keys.cert]
})

const userInfo = {
    username: 'test',
    password: 'test',
    firstName: 'Test',
    lastName: 'User'
}

/* Methods */
// Going to pretty much send loopback requests to test routes, controller, service in one shot
https.deletePromise = function(path, headers){
    var deferred = q.defer();
    const options = {
        agent: httpsAgent,
        hostname: 'localhost',
        port: 8080,
        path: path,
        method: 'DELETE'
    }
    if( headers ){
        options.headers = headers;
    }

    https.request(options, (res) => {
        deferred.notify({statusCode: res.statusCode, headers: res.headers})
        if( res.statusCode != 200 && res.statusCode != 302 ){
            deferred.reject(res.statusCode);
            return;
        }
        deferred.resolve();
    })
    .on('error', deferred.reject)
    .end()
    return deferred.promise;
}

https.getPromise = function(path, headers){
    var deferred = q.defer();
    const options = {
        agent: httpsAgent,
        hostname: 'localhost',
        port: 8080,
        path: path,
        method: 'GET'
    }
    if( headers ){
        options.headers = headers;
    }

    https.request(options, (res) => {
        deferred.notify({statusCode: res.statusCode, headers: res.headers})
        if( res.statusCode != 200 && res.statusCode != 302 ){
            deferred.reject(res.statusCode);
            return;
        }
        var resp = '';
        res
        .on('error', deferred.reject)
        .on('data', (data) => { resp += data; })
        .on('end', () => { deferred.resolve(resp)})
    })
    .on('error', deferred.reject)
    .end()
    return deferred.promise;
}

https.post = function(path, postData){
    var deferred = q.defer();
    const postStr = JSON.stringify(postData)
    const options = {
        agent: httpsAgent,
        hostname: 'localhost',
        port: 8080,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    https.request(options, (res) => {
        deferred.notify({statusCode: res.statusCode, headers: res.headers})
        if( res.statusCode != 200 && res.statusCode != 302 ){
            deferred.reject(res.statusCode);
            return;
        }
        var resp = '';
        res
        .on('error', deferred.reject)
        .on('data', (data) => { resp += data; })
        .on('end', () => { deferred.resolve(resp)})
    })
    .on('error', deferred.reject)
    .end(postStr)
    return deferred.promise;
}

/* Test Setup */
before(function(done){
    var server = require('../server.js')
    server.serverListening = done;
})

/* Test Suite */
describe('Users Module', function(){
    describe('User Registration', function(){
        it('shall allow users to be added to the database', (done) => {
            https.post('/users/register', userInfo)
            .then((resp) => {
                var json = JSON.parse(resp)
                console.log('json', json)
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
            https.post('/users/auth/local', badUserInfo)
            .then((resp) => {
                var json = JSON.parse(resp);
                assert(json.err == 'invalidUser')
                done();
            })
            .catch(done);
        })

        it('shall handle invalid password', (done) => {
            const badUserInfo = {
                username: 'test',
                password: 'dabba'
            }
            https.post('/users/auth/local', badUserInfo)
            .then((resp) => {
                var json = JSON.parse(resp);
                assert(json.err == 'invalidPass')
                done();
            })
            .catch(done);
        })

        it('shall allow users to be authenticated with username/password', (done) => {
            https.post('/users/auth/local', userInfo)
            .then((resp) => {
                assert(resp == 'Found. Redirecting to /app/app.html') // Successful login
                done();
            })
            .catch(done);
        })

        it('shall retrieve the Google clientID for the app', (done) => {
            https.getPromise(`/users/auth/google/getClientID`)
            .then((resp) => {
                console.log('resp', resp)
                done()
            })
            .catch(done)
        })
    })

    describe('Secured Routes', function(){
        it('shall not allow current user info to be retrieved if not authenticated', function(done){
            https.getPromise(`/users/secure/currentUser`)
            .then((resp) => {
                console.log('resp', resp)
                done()
            })
            .catch((err) => {
                assert(err == 401)
                done()
            })
        })

        it('shall allow current user info, less password, to be retrieved if authenticated', function(done){
            var headers = {};
            https.post('/users/auth/local', userInfo)
            .then((resp) => {
                https.getPromise(`/users/secure/currentUser`, headers)
                .then((resp) => {
                    var currentUser = JSON.parse(resp)
                    console.log('currentUser', currentUser.id)
                    assert(currentUser != undefined)
                    assert(currentUser.password == undefined)
                    assert(currentUser.passwordHash == undefined)
                    done()
                })
                .catch(done)
            }, (err) => {
                console.log('login err', err)
                done(err)
            }, (data) => {
                if( data.headers )
                    headers.Cookie = data.headers['set-cookie']
            })
        })

        it('shall allow the current user to be deleted, if authenticated', function(done){
            var headers = {};
            https.post('/users/auth/local', userInfo)
            .then((resp) => {
                https.getPromise(`/users/secure/currentUser`, headers)
                .then((resp) => {
                    var currentUser = JSON.parse(resp)
                    console.log('currentUser', currentUser.id)
                    https.deletePromise(`/users/secure/delete/${currentUser.id}`, headers)
                    .then(done, done)
                }, (err) => {
                    console.log('Error getting currentUser', err)
                    done(err);
                })
            }, (err) => {
                console.log('login err', err)
                done(err)
            }, (data) => {
                if( data.headers )
                    headers.Cookie = data.headers['set-cookie']
            });
        })
    })
})

/* Test Cleanup */
after((done) => {
    process.exit(); // cleaner way would be to stop server and disconnect from mongo
})
