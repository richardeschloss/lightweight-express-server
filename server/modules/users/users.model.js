/* Requires */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User } = require('./users.schemas')

/* Constants */
const Schema = mongoose.Schema;
const UserSchema = new Schema(User, { toJSON: { virtuals: true } })

UserSchema.methods = {
    hashPassword: function(password){
        this.passwordHash = bcrypt.hashSync(password, 10)
    },

    validPassword: function(password){
        return bcrypt.compareSync(password, this.passwordHash)
    }
}

/* Export Model(s) */
exports.User = mongoose.model('User', UserSchema);
