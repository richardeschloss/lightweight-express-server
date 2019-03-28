const { MongoStorage } = require('./utils/storage');

const mongoStorage = new MongoStorage();

/* Connect to DB */
mongoStorage
.connect()
.then((resp) => {
    console.log(resp)
    if( exports.mongoConnected ) {
        exports.mongoConnected();
        exports.disconnectMongo = function(){
            console.log('disconnect mongo...')
            mongoStorage.disconnect()
        }
    }
})
.catch(console.error)
