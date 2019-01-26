/* Requires */
const { GoogleUser } = require('../google/gUsers/gUsers.schemas')

const User = {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    dateCreated: { type: Date, default: Date.now },
    dateModified: { type: Date, default: Date.now },

    // Google-related:
    googleProfile: GoogleUser
}

exports.User = User;
