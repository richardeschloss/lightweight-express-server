/* Requires */
const express = require('express');
const { UserCtrl } = require('../modules/users/users.controller');

/* Constants */
const secureRoutes = express.Router();
const userRoutes = express.Router();
const userCtrl = new UserCtrl();

/* Routes */
secureRoutes
.get('/currentUser', userCtrl.findCurrentUser)
.get('/findAll', userCtrl.findAll)
.get('/find/:id', userCtrl.findById)
.post('/update', userCtrl.updateUser)
.delete('/delete/:id', userCtrl.delete)

userRoutes
.get('/auth/google', userCtrl.authenticateGoogle)
.get('/auth/google/callback', userCtrl.googleAuthCallback)
.get('/auth/google/getClientID', userCtrl.getGoogleClientID)
.post('/clientCert', userCtrl.validateClientCert)
.post('/generateClientCert', userCtrl.generateClientCert)
.post('/auth/local', userCtrl.authenticate)
.post('/register', userCtrl.addUser)
.post('/auth/google/validateGoogleClient', userCtrl.validateGoogleClient)
.use('/secure', userCtrl.checkUser, secureRoutes)

module.exports = userRoutes;
