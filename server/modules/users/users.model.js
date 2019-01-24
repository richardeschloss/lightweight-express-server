/* Requires */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { GoogleProfile, User } = require('./users.schemas')

/* Constants */
const Schema = mongoose.Schema;
const GoogleProfileSchema = new Schema(GoogleProfile)
const UserSchema = new Schema(User)

UserSchema.methods = {
    validPassword: function(password){
        return bcrypt.compareSync(password, this.passwordHash)
    }
}

UserSchema.set('toJSON', { virtuals: true });

/* Export Model(s) */
exports.User = mongoose.model('User', UserSchema);
