/* Requires */

/* Models */
const { User } = require('./users.model');

/* Class */
// NOTE: mongoose is pretty cool..we tell mongoose to connect to the db from the start (in server.js)
// and we can just start using the mongoose models. It will queue up the operations even if connecting
// to the db were still in progress.
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

    async authenticate(userInfo){
        var user = await this.findOne({ username: userInfo.username })
        if( !user ){
            throw { err: 'invalidUser', msg: 'Incorrect username.' }
        }

        if( !user.validPassword(userInfo.password) ){
            throw { err: 'invalidPass', msg: 'Incorrect password.' }
        }
        delete user.passwordHash;
        return user;
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

        return await this.addUser(userInfo);
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
