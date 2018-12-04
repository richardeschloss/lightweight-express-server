/* Requires */
const fs = require('fs');
const pem = require('pem');

/* Exports */
exports.generateSelfSignedCert = function(callback){
    pem.createCertificate({days:30, selfSigned:true}, (err, keys) => {
        fs.writeFileSync('./localhost.key', keys.serviceKey)
        fs.writeFileSync('./localhost.crt', keys.certificate)
        console.log('keys written to ./localhost.*')
        callback();
    });
}

exports.loadSelfSignedCert = function(){
    var keys = {}
    try{
        keys.key = fs.readFileSync('./localhost.key')
        keys.cert = fs.readFileSync('./localhost.crt')
    } catch(err){
        keys.err = err;
    }
    return keys;
}
