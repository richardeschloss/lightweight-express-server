/* Requires */
const express = require('express');
const { UserCtrl } = require('./users.controller');

/* Constants */
const secureRoutes = express.Router();
const userRoutes = express.Router();
const userCtrl = new UserCtrl();

/* Routes */
secureRoutes
.get('/currentUser', userCtrl.findCurrentUser)
.get('/find/:id', userCtrl.findById)
.post('/update', userCtrl.updateUser)
.post('/delete/', userCtrl.delete)

userRoutes
.post('/clientCert', userCtrl.validateClientCert)
.post('/generateClientCert', userCtrl.generateClientCert)
.post('/auth/local', userCtrl.authenticate)
.post('/register', userCtrl.addUser)
.use('/secure', userCtrl.checkUser, secureRoutes)

module.exports = userRoutes;
