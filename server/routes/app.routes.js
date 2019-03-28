/* Requires */
const express = require('express');
const { UserCtrl } = require('../modules/users/users.controller');

/* Constants */
const appRoutes = express.Router();
const secureRoutes = express.Router();
const userCtrl = new UserCtrl();

secureRoutes
.get('/getSecureDummyInfo', (req, res, next) => {
  res.json({info: 4321})
})

appRoutes
.get('/getDummyInfo', (req, res, next) => {
  res.json({info: 1234})
})
.get('/getSessionInfo', (req, res, next) => {
  if(req.session.page_views){
    req.session.page_views++;
    res.json({
      viewCnt: req.session.page_views,
      msg: "You visited this page " + req.session.page_views + " times",
      session: req.session // If user is logged in, req.session.passport.user will also be set
    });
  } else {
    req.session.page_views = 1;
    res.json({
      viewCnt: req.session.page_views,
      msg: "Welcome to this page for the first time!",
      session: req.session // If user is logged in, req.session.passport.user will also be set
    });
  }
})
.use('/secure', userCtrl.checkUser, secureRoutes);

module.exports = appRoutes;
