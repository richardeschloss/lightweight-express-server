/* Requires */

/* Models */
const { GoogleUser } = require('./gUsers.models');

class GoogleUserService{
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
