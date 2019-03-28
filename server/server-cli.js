#!/usr/local/bin/node
/* Requires */
const argv = require('minimist')(process.argv.slice(2));
const action = argv.action || 'startServer';
const { config } = require('./config');
const securityUtils = require('./utils/security');

const actions = {
  startServer: () => {
    const { AppServer } = require('./server.js');
    const serverCfg = {
      proto: argv.proto || 'http',
      hostname: argv.hostname || 'localhost',
      port: argv.port || 8080,
      frontend_root: argv.frontend_root || 'public',
      browser: argv.browser
    }

    /* Start */
    const appServer = new AppServer(serverCfg);
    appServer.start();

    appServer.dbConnected = () => {
      console.log('DB connected');
    }

    appServer.serverListening = () => {
      console.log('serverCfg', serverCfg)
      console.log('Server listening', appServer.url)
      appServer.openBrowser()
    }
  },

  generateClientCert: () => {
    var options = {
        server: {
            key: argv.serverKey || config.appServer.ssl.key,
            crt: argv.serverCrt || config.appServer.ssl.cert
        },
        client: {
            privateKey: argv.name + '.key',
            csr: argv.name + '.csr',
            crt: argv.name + '.crt',
            pem: argv.name + '.pem',
            p12: argv.name + '.p12',
            days: argv.days || '365',
            name: argv.name || '',
            emailAddress: argv.emailAddress || '',
            organization: argv.organization || '',
            organizationalUnit: argv.organizationalUnit || '',
            countryCode: argv.countryCode || '',
            state: argv.state || '',
            city: argv.city || '',
            exportPassphrase: argv.pass || ''
        }
    }
    securityUtils.generateClientCert(options, () => {
      console.log('client cert generated')
    })
  },

  generateMongoCerts: () => {
    argv.serverName = argv.serverName || 'mongod';
    argv.clientName = argv.clientName || 'mongoClient';
    argv.outputDir = argv.outputDir || './.mongod';
    console.log('argv now', argv)

    var options = {
      server: {
        key: `${argv.outputDir}/${argv.serverName}.key`,
        crt: `${argv.outputDir}/${argv.serverName}.crt`,
        pem: `${argv.outputDir}/${argv.serverName}.pem`,
        days: argv.days || '365',
        name: argv.domainName || 'localhost',
        emailAddress: argv.emailAddress || '',
        organization: argv.organization || '',
        organizationalUnit: argv.organizationalUnit || '',
        countryCode: argv.countryCode || '',
        state: argv.state || '',
        city: argv.city || '',
        exportPassphrase: argv.pass || ''
      },
      client: {
        key: `${argv.outputDir}/${argv.clientName}.key`,
        crt: `${argv.outputDir}/${argv.clientName}.crt`,
        pem: `${argv.outputDir}/${argv.clientName}.pem`,
        days: argv.days || '365',
        name: argv.domainName || 'localhost',
        emailAddress: argv.emailAddress || '',
        organization: argv.organization || '',
        organizationalUnit: argv.organizationalUnit || '',
        countryCode: argv.countryCode || '',
        state: argv.state || '',
        city: argv.city || '',
        exportPassphrase: argv.pass || ''
      }
    }
    securityUtils.generateMongoCerts(options, () => {
      console.log('created mongo certs')
    });
  },

  generateSelfSignedCert: () => {
    securityUtils.generateSelfSignedCert(argv, (filesOut) => {
      console.log('created', filesOut)
    });
  },

  viewCertificate: () => {
    securityUtils.viewCertificate({ crt: argv.crt }, () => {
      console.log('^^^ cert ^^^')
    })
  }
}

const possibleActions = Object.keys(actions);
if( !actions[action] || argv.h || argv.help ){
  console.log('Usage:\tserver/server.cli.js --action=[action] [action arguments]\r\n')
  console.log('Default action is: startServer\r\n')
  console.log('Possible actions are:\r\n\t' + possibleActions.sort().join('\r\n\t') + '\r\n')
} else {
  console.log('Performing action:', action)
  actions[action]();
}
