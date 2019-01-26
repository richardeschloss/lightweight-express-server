/* Requires */
const https = require('https');
const q = require('q');
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

function request(requestOptions, postData, responseOptions){
    var deferred = q.defer();
    var options = {
        agent: httpsAgent,
        hostname: 'localhost',
        port: 8080,
        path: requestOptions.path,
        method: requestOptions.method || 'GET',
        headers: {}
    }
    var postStr;

    Object.assign(options, requestOptions)
    if( options.method == 'POST' ){
        options['Content-Type'] = 'application/json';
        postStr = JSON.stringify(postData)
    }
    console.log('options', options)

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
