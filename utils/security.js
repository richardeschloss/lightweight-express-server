/* Requires */
const argv = require('minimist')(process.argv.slice(2))
const async = require('async');
const debug = require('debug')('utils:security')
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

/* Exports */
exports.generateClientCert = function(options, callback){
    const cmd = 'openssl';
    console.log('generateClientCert...', options)

    function generateCSR(next){
        var args = [
            'req',
            '-newkey', 'rsa:4096',
            '-keyout', options.client.privateKey,
            '-out', options.client.csr,
            '-nodes',
            '-days', options.client.days,
            '-subj', `/CN=${options.client.name}`
        ]

        spawn(cmd, args)
        .on('close', () => {
            debug('Generated', options.client.csr)
            next();
        })
    }

    function signCSR(next){
        var args = [
            'x509',
            '-req',
            '-in', options.client.csr,
            '-CA', options.server.crt || 'localhost.crt',
            '-CAkey', options.server.key || 'localhost.key',
            '-out', options.client.crt,
            '-set_serial', '01',
            '-days', options.client.days
        ]
        spawn(cmd, args)
        .on('close', () => {
            debug('Signed', options.client.csr, 'and created', options.client.csr)
            next();
        })
    }

    function exportCert(next){
        var args = [
             'pkcs12',
             '-export',
             '-clcerts',
             '-in', options.client.crt,
             '-inkey', options.client.privateKey,
             '-out', options.client.p12,
             '-password', `pass:${options.client.exportPassphrase}`
        ]
        spawn(cmd, args)
        .on('close', () => {
            debug('exported to', options.client.p12, 'on', Date.now())
            next();
        })
    }

    async.series([
        generateCSR,
        signCSR,
        exportCert
    ], callback)
}

exports.generateSelfSignedCert = function(options, callback){
    /*
    The following was added to the end of /etc/ssl/openssl.cnf: (i.e., my extensions)
        [ myExt ]
        basicConstraints = critical,CA:true
        subjectKeyIdentifier = hash
        authorityKeyIdentifier = keyid:always,issuer
        subjectAltName = DNS:localhost
    */

    const cmd = 'openssl';
    const args = [
        'req',
        '-newkey', 'rsa:2048',
        '-x509',
        '-nodes',
        '-keyout', options.key || 'localhost.key',
        '-new',
        '-out', options.crt || 'localhost.crt',
        '-subj', '/CN=' + (options.domain || 'localhost'),
        '-sha256',
        '-days', options.days || 365,
        '-extensions', options.extSection || 'myExt',
        '-config', options.configFile || '/etc/ssl/openssl.cnf'
    ]
    spawn(cmd, args)
    .on('close', () => {
        callback();
    })
}

exports.loadSelfSignedCert = function(options, callback){
    var keys = {}
    const serverSSLDir = '/etc/ssl/selfSigned'
    try{
        keys.key = fs.readFileSync(path.resolve(serverSSLDir,'localhost.key'))
        keys.cert = fs.readFileSync(path.resolve(serverSSLDir,'localhost.crt'))
        if( callback ) callback();
    } catch(err){
        keys.err = err;
        if( callback ) callback(err);
    }
    return keys;
}

exports.viewCertificate = function(options, callback){
    const cmd = 'openssl';
    const args = [
        'x509',
        '-in', options.crt || 'localhost.crt',
        '-text'
    ];
    const child = spawn(cmd, args)
    child.stdout.on('data', (data) => console.log(data.toString()))
    child.stderr.on('data', (data) => console.error(data.toString()))
    child.on('close', callback)
}

if( argv.action ){
    console.log(argv.action, '...')
    if( !exports[argv.action] ){
        console.log('possible actions:\r\n', Object.keys(exports))
        process.exit(1);
    }
    exports[argv.action](argv, () => {
        console.log(argv.action, 'done')
    })
}
