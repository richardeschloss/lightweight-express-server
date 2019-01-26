/* Requires */
const express = require('express');
const { GoogleUserCtrl } = require('./gUsers.controller');

/* Constants */
const secureRoutes = express.Router();
const gUserRoutes = express.Router();
const gUserCtrl = new GoogleUserCtrl();

gUserRoutes
.get('/auth', gUserCtrl.auth)
.get('/auth/callback', gUserCtrl.authCallback)
.get('/auth/getClientID', gUserCtrl.getClientID)
.post('/auth/validateClient', gUserCtrl.validateClient)

module.exports = gUserRoutes;
