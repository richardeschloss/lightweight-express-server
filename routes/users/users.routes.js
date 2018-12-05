/* Requires */
const express = require('express');
const UserCtrl = require('./users.controller').UserCtrl;

/* Constants */
const secureRoutes = express.Router();
const userRoutes = express.Router();
const userCtrl = new UserCtrl();

/* Routes */
secureRoutes
.get('/currentUser', userCtrl.findCurrentUser)
.get('/findAll', userCtrl.findAll)
.get('/:id', userCtrl.findById)
.post('/update', userCtrl.updateUser)
.delete('/:id', userCtrl.delete)

userRoutes
.post('/clientCert', userCtrl.validateClientCert)
.post('/generateClientCert', userCtrl.generateClientCert)
.post('/login', userCtrl.authenticate)
.post('/register', userCtrl.addUser)
.post('/googleClient', userCtrl.validateGoogleClient)
.use('/secure', userCtrl.checkUser, secureRoutes)

module.exports = userRoutes;
