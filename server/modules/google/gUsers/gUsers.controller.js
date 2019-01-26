/* Requires */
const assert = require('assert')
const debug = require('debug')('controllers:users')
const passport = require('passport');
const { OAuth2Strategy:GoogleStrategy } = require('passport-google-oauth');
const { GoogleUserService }  = require('./gUsers.service');
const { UserService } = require('../../users/users.service');
const os = require('os')

/* Constants */
const gUserService = new GoogleUserService();
const userService = new UserService();

// Require googleClient.json. This code expects the json to be structured as:
/*
{
    "CLIENT_ID": "[your_client_id].apps.googleusercontent.com",
    "CLIENT_SECRET": "[your_client_secret]"
}
*/
const googleClient = require(`${os.homedir()}/.oauth/googleClient.json`)
assert(googleClient.ClIENT_ID != '', 'CLIENT_ID needed')
assert(googleClient.ClIENT_SECRET != '', 'ClIENT_SECRET needed')

// Google strategy config (if googleClient is defined)
passport.use(new GoogleStrategy({
    clientID: googleClient.CLIENT_ID,
    clientSecret: googleClient.CLIENT_SECRET,
    callbackURL: 'https://localhost:8080/google/gUsers/auth/callback'
  },
  function(accessToken, refreshToken, profile, done) {
      profile.googleId = profile.id;
      gUserService.findOrCreate({googleId: profile.id}, profile)
      .then((gUser) => {
          return userService.findOrCreate({'googleProfile.googleId' : gUser.googleId}, {
              /* User model */
              username: profile.displayName,
              password: accessToken,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              id: gUser.id,
              googleProfile: gUser
          })
      })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  }
));

class GoogleUserCtrl{
    auth(req, res, next){
        passport.authenticate('google', {
            scope: [
                'profile',
                'email',
                'openid'
            ]
        })(req, res, next);
    }

    authCallback(req, res, next){
        console.log('authCallback!!')
        passport.authenticate('google', function(err, user, info) {
            console.log('err, user', err, user)
            if( err ){
                return next(err);
            }

            if( !user ){
                res.json(info)
            }

            req.logIn(user, function(err) {
                console.log('login err....', err)
                if (err) { return next(err); }
                return res.redirect('/app/app.html');
            });
        })(req, res, next);
    }

    getClientID(req, res, next){
        res.json({CLIENT_ID: googleClient.CLIENT_ID})
    }

    validateClient(req, res, next){
        const CLIENT_ID = googleClient.CLIENT_ID;
        const idToken = req.body.idToken;

        const {OAuth2Client} = require('google-auth-library');
        const client = new OAuth2Client(CLIENT_ID);
        async function verify() {
          const ticket = await client.verifyIdToken({
              idToken: idToken,
              audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
              // Or, if multiple clients access the backend:
              //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
          });
          const payload = ticket.getPayload();
          const userid = payload['sub'];
          // If request specified a G Suite domain:
          //const domain = payload['hd'];
        }
        verify()
        .then((resp) => {
            debug('google client validated idToken=', idToken)
            res.status(200)
            .send('success')
        }, (err) => {
            res.status(401)
            .send('verify_err')
        });
    }

}

exports.GoogleUserCtrl = GoogleUserCtrl;
