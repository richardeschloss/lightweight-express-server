const { MongoStorage } = require('../../../utils/storage');
const mongoStorage = new MongoStorage();

/* Models */
const { GoogleUser } = require('./gUsers.models');

class GoogleUserService{
    async connect(){
        return await mongoStorage.connect().catch(console.error);
    }

    async disconnect(){
        return await mongoStorage.disconnect().catch(console.error);
    }

    async findOrCreate(query, userInfo){
        var user = await GoogleUser.findOne(query)
        if( user ){
            return user;
        }

        var createdUser = new GoogleUser(userInfo);
        return await createdUser.save()
        .catch(console.error);
    }
}

exports.GoogleUserService = GoogleUserService;
