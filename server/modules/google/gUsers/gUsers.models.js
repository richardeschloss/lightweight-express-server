/* Requires */
const mongoose = require('mongoose');
const { GoogleUser } = require('./gUsers.schemas')

/* Constants */
const Schema = mongoose.Schema;
const GoogleUserSchema = new Schema(GoogleUser, { toJSON: { virtuals: true } })

GoogleUserSchema.methods = {

}

/* Export Model(s) */
exports.GoogleUser = mongoose.model('GoogleUser', GoogleUserSchema);
