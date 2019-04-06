'use strict';

/* Requires */
const debug = require('debug')('utils:storage')
const fs = require('fs');
const mongoose = require('mongoose');
const os = require('os');
const path = require('path');

const { config } = require('../config.js');

/* Classes */
class MongoStorage{
    constructor(){
        this.dbName = config.mongoClient.dbName;
        this.dbHost = config.mongoClient.dbHost || '127.0.0.1';
        this.dbPort = config.mongoClient.dbPort || '27017';
        this.shards = config.mongoClient.shards || [];
    }

    buildConnectionURI(){
       var connectionURI = 'mongodb://';
       if( this.shards.length > 0 ){
           // Build string using shards
           var connectionURIs = [];
           this.shards.forEach((shard) => {
               connectionURIs.push(`${shard.host}:${shard.dbPort || this.dbPort}/${this.dbName}`)
           })
           connectionURI += connectionURIs.join(',')
       } else {
           // Build string using this.dbHost and this.dbPort
           connectionURI += `${this.dbHost}:${this.dbPort}/${this.dbName}`
       }

       return connectionURI;
    }

    async connect(){
        if( mongoose.connection.readyState == 1 ){
            debug('already connected')
            return;
        }
        var options = config.mongoClient.connectOptions;

        options.useNewUrlParser = true;
        const homeDir = os.homedir();
        if( options.ssl ){
            // (Self-signed certs for dev)
            ['sslKey', 'sslCert', 'sslCA'].forEach((option) => {
                if( typeof options[option] == 'string' ){
                    // convert to buffer (mongodb nodejs api expects buffer)
                    options[option] = fs.readFileSync(options[option].replace('~', homeDir));
                }
            })
        }
        
        if( options.authMechanism == 'MONGODB-X509' ){
            // Auth using client X509 cert:
            this.dbName = 'admin';
            options.authSource = '$external';
        } else {
            // Using SCRAM:
            options.authSource = options.authSource || this.dbName;
        }
        var connectionStr = this.buildConnectionURI();
        debug('Connecting to db...', connectionStr)
        await mongoose.connect(connectionStr, options)
        console.log('Connected to db', {
            host: this.dbHost,
            port: this.dbPort,
            dbName: this.dbName
        });
    }

    async disconnect(){
        await mongoose.connection.close();
    }
}

exports.MongoStorage = MongoStorage;
