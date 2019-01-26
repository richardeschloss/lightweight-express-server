/* Requires */

/* Models */
const { User } = require('./users.model');

/* Class */
class UserService{
    async addUser(userInfo){
        var user = new User(userInfo);
        user.hashPassword(userInfo.password)
        return await user.save()
        .catch((error) => {
            const errMsgs = {
                11000: 'Username already exists, pick another one'
            }
            throw { err: error.code, msg: errMsgs[error.code] || error };
        });
    }

    async connect(){
        return await mongoStorage.connect().catch(console.error);
    }

    async disconnect(){
        return await mongoStorage.disconnect().catch(console.error);
    }

    async delete(id){
        return await User.findByIdAndRemove(id);
    }

    async findAll(){
        return await User.find().select('-passwordHash');
    }

    async findById(id){
        return await User.findById(id).select('-passwordHash');
    }

    async findOne(userInfo){
        return await User.findOne(userInfo).catch(console.error);
    }

    async findOrCreate(query, userInfo){
        var user = await User.findOne(query)
        if( user ){
            return user;
        }

        user.hashPassword(userInfo.password)
        var createdUser = new User(userInfo);
        return await createdUser.save()
        .catch(console.error);
    }

    async update(userInfo){
        var user = await User.findById(userInfo.id)
        .catch((err) => {
            throw { msg: 'user not found' };
        })

        if( !user ){
            throw { msg: 'user not found' };
        }

        Object.assign(user, userInfo);
        if( user.password ){
            user.hashPassword(userInfo.password)
        }
        user.dateModified = Date.now();
        return await user.save().catch(console.error);
    }

    async validateUser(userInfo){
        var user = await User.findById(userInfo.id)
        .catch((err) => {
            throw new Error(err);
        })

        if( !user ){
            throw { msg: 'user not found' };
        }

        if( !user.validPassword(userInfo.password) ){
            throw { msg: 'incorrect password' }
        }
    }
}

exports.UserService = UserService;
