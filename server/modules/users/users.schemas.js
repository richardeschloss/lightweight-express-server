const GoogleProfile = {
    id: String,
    displayName: String,
    name: {},
    emails: [],
    photos: []
}

const User = {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    dateCreated: { type: Date, default: Date.now },
    dateModified: { type: Date, default: Date.now },

    // Google-related:
    googleProfile: GoogleProfile
}

exports.GoogleProfile = GoogleProfile;
exports.User = User;
