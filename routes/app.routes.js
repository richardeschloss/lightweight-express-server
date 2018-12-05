/* Requires */
const express = require('express');
const UserCtrl = require('./users/users.controller').UserCtrl;

/* Constants */
const appRoutes = express.Router();
const secureRoutes = express.Router();
const userCtrl = new UserCtrl();

secureRoutes
.get('/getSecureInfo', userCtrl.checkUser, (req, res, next) => {
    res.json({info: 4321})
})

appRoutes
.get('/getInfo', (req, res, next) => {
    res.json({info: 1234})
})
.use('/secure', secureRoutes);

module.exports = appRoutes;
