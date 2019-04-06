/* Requires */
const async = require('async');
const { config } = require('../config.js');
const debug = require('debug')('utils:security')
const fs = require('fs');
const path = require('path');
const q = require('q');
const spawn = require('child_process').spawn;

/* Exports */
exports.generateMongoCerts = function(options, callback){
  // Hi, checking this out? Prefer bash? That's cool! Here you go:
  // openssl req -newkey rsa:2048 -new -x509 -days 365 -nodes -out mongod.crt -keyout mongod.key -subj /CN=localhost
  // openssl req -newkey rsa:2048 -new -x509 -days 365 -nodes -out mongoClient.crt -keyout mongoClient.key -subj /CN=localhost
  // cat mongoClient.key mongoClient.crt > mongoClient.pem
  // cat mongod.key mongod.crt > mongod.pem
  function generateCert(){
    var deferred = q.defer();
    var who = options.who || 'client';
    var cmd = 'openssl';
    var args = [
        'req',
        '-newkey', 'rsa:4096',
        '-new', '-x509',
        '-days', options[who].days,
        '-nodes',
        '-out', options[who].crt,
        '-keyout', options[who].key,
        '-subj', [`/CN=${options[who].name}`,
            `/emailAddress=${options[who].emailAddress}`,
            `/O=${options[who].organization}`,
            `/OU=${options[who].organizationalUnit}`,
            `/C=${options[who].countryCode}`,
            `/ST=${options[who].state}`,
            `/L=${options[who].city}`
        ].join('')
    ]

    debug(cmd, args.join(' '))
    spawn(cmd, args)
    .on('close', deferred.resolve);
    return deferred.promise;
  }

  function packageCert(){
    var who = options.who || 'client';
    var key = fs.readFileSync(options[who].key)
    var crt = fs.readFileSync(options[who].crt)
    fs.appendFileSync(options[who].pem, key);
    fs.appendFileSync(options[who].pem, crt);

  }

  function clearRemnants(){
    ['client', 'server'].forEach((item) => {
      ['key', 'crt'].forEach((subItem) => {
        fs.unlinkSync(options[item][subItem]);
      })
    })
  }

  generateCert()
  .then(packageCert)
  .then(() => { options.who = 'server' })
  .then(generateCert)
  .then(packageCert)
  .then(clearRemnants)
  .then(callback);
}

exports.generateClientCert = function(options, callback){
    const cmd = 'openssl';
    debug('generateClientCert...', options)

    function generateCSR(next){
        var args = [
            'req',
            '-newkey', 'rsa:4096',
            '-keyout', options.client.privateKey,
            '-out', options.client.csr,
            '-nodes',
            '-days', options.client.days,
            '-subj', [`/CN=${options.client.name}`,
                `/emailAddress=${options.client.emailAddress}`,
                `/O=${options.client.organization}`,
                `/OU=${options.client.organizationalUnit}`,
                `/C=${options.client.countryCode}`,
                `/ST=${options.client.state}`,
                `/L=${options.client.city}`
            ].join('')
        ]

        debug(cmd, args.join(' '))
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
        debug('args', args)
        spawn(cmd, args)
        .on('close', () => {
            debug('Signed', options.client.csr, 'and created', options.client.crt)
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

    function clearRemnants(next){
      ['privateKey', 'csr', 'crt'].forEach((item) => {
        fs.unlinkSync(options.client[item]);
      })
      next();
    }

    async.series([
        generateCSR,
        signCSR,
        exportCert,
        clearRemnants
    ], callback)
}

exports.generateSelfSignedCert = function(options, callback){
    /*
    Basing off openssl's template /etc/ssl/openssl.cnf (copied to ./.ssl)
    The following was added to the end of that (i.e., myExt)
      [ myExt ]
      basicConstraints = critical,CA:true
      subjectKeyIdentifier = hash
      authorityKeyIdentifier = keyid:always,issuer
      subjectAltName = @alt_names

      [alt_names]
      DNS.1 = localhost
      DNS.2 = lightweight_express_server
    */

    const dest = {
      keyout: options.key || 'localhost.key',
      out: options.crt || 'localhost.crt'
    }
    const cmd = 'openssl';
    const args = [
        'req',
        '-newkey', 'rsa:2048',
        '-x509',
        '-nodes',
        '-keyout', dest.keyout,
        '-new',
        '-out', dest.out,
        '-subj', [
            `/CN=(${options.domain || 'localhost'})`,
            `/emailAddress=${options.emailAddress || ''}`,
            `/O=${options.organization || ''}`,
            `/OU=${options.organizationalUnit || ''}`,
            `/C=${options.countryCode || ''}`,
            `/ST=${options.state || ''}`,
            `/L=${options.city || ''}`
        ].join(''),
        '-sha256',
        '-days', options.days || 365,
        '-extensions', options.extSection || 'myExt',
        '-config', options.configFile || './.ssl/openssl.cnf'
    ]
    debug(cmd, args.join(' '))
    spawn(cmd, args)
    .on('close', () => {
        if( callback ) callback(dest);
    })
}

exports.loadSelfSignedCert = function(callback){
    var keys = {}
    try{
        keys.key = fs.readFileSync(path.resolve(config.appServer.ssl.key));
        keys.cert = fs.readFileSync(path.resolve(config.appServer.ssl.cert));
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
        '-in', options.crt || path.resolve(config.appServer.ssl.cert),
        '-text'
    ];
    const child = spawn(cmd, args)
    child.stdout.on('data', (data) => console.log(data.toString()))
    child.stderr.on('data', (data) => console.error(data.toString()))
    child.on('close', callback)
}
