/* Requires */
const debug = require('debug')('utils:requester');
const http = require('http');
const https = require('https');
const q = require('q');
const securityUtils = require('../utils/security')

/* Constants */
const keys = securityUtils.loadSelfSignedCert()
if( keys.err ){
    debug('Error loading cert', keys.err)
    process.exit(1);
}

const httpAgent = new http.Agent({
    keepAliveMsecs: 10000,
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: 256
})

const httpsAgent = new https.Agent({
    keepAliveMsecs: 10000,
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: 256,
    key: keys.key,
    cert: keys.cert,
    ca: [keys.cert]
})

function request(requestOptions, postData, responseOptions){
    var deferred = q.defer();
    var options = {
        hostname: requestOptions.hostname || 'localhost',
        port: requestOptions.port || 8080,
        path: requestOptions.path,
        method: requestOptions.method || 'GET',
        headers: requestOptions.headers || {}
    }
    var protoStr = requestOptions.proto || 'https';
    var proto;
    if( protoStr == 'https' ){
      proto = https;
      options.agent = httpsAgent
    } else {
      proto = http;
      options.agent = httpAgent
    }
    var postStr;
    if( options.method == 'POST' ){
        options.headers['Content-Type'] = 'application/json';
        postStr = JSON.stringify(postData)
    }
    debug('options', options)
    debug('postStr', postStr)

    proto.request(options, (res) => {
        deferred.notify({statusCode: res.statusCode, headers: res.headers})
        if( res.statusCode != 200 && res.statusCode != 302 ){
            deferred.reject(res.statusCode);
            return;
        }
        var resp = '';
        res
        .on('error', deferred.reject)
        .on('data', (data) => { resp += data; })
        .on('end', () => {
            if( responseOptions && responseOptions.returnJSON ){
                deferred.resolve(JSON.parse(resp))
            } else {
                deferred.resolve(resp)
            }
        })
    })
    .on('error', deferred.reject)
    .end(postStr)
    return deferred.promise;
}

exports.request = request;
