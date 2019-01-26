/* Requires */
const async = require('async');

var server;

/* Test Setup */
before(function(done){
    var doneCnt = 0;
    var events = [
        'serverListening',
        'mongoConnected'
    ]

    server = require('../server.js')
    async.each(events, (evt, callback) => {
        server[evt] = function(){
            console.log(evt)
            callback();
        };
    }, done)
})

/* Test Cleanup */
after(function(){
    server.disconnectMongo();
    server.stop();
})
