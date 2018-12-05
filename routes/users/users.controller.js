/* Requires */
const debug = require('debug')('controllers:users')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserService = require('./users.service').UserService;
const securityUtils = require('../../utils/security')

const config = require('../../config.json')

/* Constants */
const userService = new UserService();

/* Passport Config */
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    userService.findById(id)
    .then((user) => done(null, user))
    .catch(done);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        userService.findOne({ username: username })
        .then((user) => {
            if( !user ){
                return done(null, false, { message: 'Incorrect username.' });
            }

            if( !user.validPassword(password) ){
                return done(null, false, { message: 'Incorrect password.' });
            }
            delete user.passwordHash;
            return done(null, user);
        })
        .catch((err) => done(err))
    }
));

/* Class */
class UserCtrl{
    constructor(){
    }

    addUser(req, res, next){
        userService.addUser(req.body)
        .then((resp) => res.json({msg: 'added user'}))
        .catch(next)
    }

    authenticate(req, res, next){
        passport.authenticate('local', function(err, user, info) {
            if( err ){
                return next(err);
            }

            if( !user ){
                res.json(info)
            }

            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/app/app.html');
            });
        })(req, res, next);
    }

    checkUser(req, res, next){
        if( !req.user ){
            next({msg: 'Unauthorized'})
        } else {
            console.log('current user', req.user)
            next();
        }
    }

    delete(req, res, next){
        userService.delete(req.params.id)
        .then(() => res.json({msg: 'deleted user' + req.params.id}))
        .catch(err => next(err));
    }

    findAll(req, res, next){
        userService.findAll()
        .then((users) => res.json(users));
    }

    findById(req, res, next){
        userService.findById(req.params.id)
        .then((user) => res.json(user))
        .catch((err) => next({msg: 'user not found'}))
    }

    findCurrentUser(req, res, next){
        userService.findById(req.user.id)
        .then((user) => res.json(user))
        .catch((err) => next(err));
    }

    generateClientCert(req, res, next){
        console.log('req', req.body)
        if( !req.body.name || req.body.name == '' ){
            res.status(401)
            .send('err...need to specify a client name')
            return;
        }

        var options = {
            server: {
                key: '/etc/ssl/selfSigned/localhost.key',
                crt: '/etc/ssl/selfSigned/localhost.crt'
            },
            client: {
                privateKey: 'client.key',
                csr: req.body.name + '.csr',
                crt: req.body.name + '.crt',
                p12: req.body.name + '.p12',
                days: req.body.days || '365',
                name: req.body.name,
                exportPassphrase: req.body.pass || ''
            }
        }

        securityUtils.generateClientCert(options, (err) => {
            res.sendFile(options.client.p12, { root: '.' })
        })
    }

    updateUser(req, res, next){
        userService.update(req.body)
        .then((user) => res.json('ok'))
        .catch((err) => next(err));
    }

    validateClientCert(req, res, next){
        console.log('validateClientCert')
        console.log('req.client')
        const cert = req.connection.getPeerCertificate()
        if( req.client.authorized ){
            res.status(200).send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`)
            next();
        } else if( cert.subject ){
            res.status(403)
    		.send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`)
        } else {
            res.status(401)
            next({msg: `Sorry, but you need to provide a client certificate to continue.`})
        }
    }

    validateGoogleClient(req, res, next){
        const CLIENT_ID = config.googleClient.CLIENT_ID;// '742894255659-33r2knrd7rarbv8c9pg9mkjsbiina5g2.apps.googleusercontent.com';
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

exports.UserCtrl = UserCtrl;
