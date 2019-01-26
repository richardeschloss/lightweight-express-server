before(function(done){
    var server = require('../server.js')
    server.serverListening = done;
})

after(function(){
    process.exit()
})
