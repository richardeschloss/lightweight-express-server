/* Requires */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/* Constants */
const Schema = mongoose.Schema;
const UserSchema = { // Thank you Jason Watmore for your blog post...
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    dateCreated: { type: Date, default: Date.now },
    dateModified: { type: Date, default: Date.now }
}

const userSchema = new Schema(UserSchema);
userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.passwordHash)
}

userSchema.set('toJSON', { virtuals: true });

/* Export Model(s) */
exports.User = mongoose.model('User', userSchema);
