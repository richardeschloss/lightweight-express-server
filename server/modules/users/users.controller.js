/* Requires */
const debug = require('debug')('controllers:users')
const { config } = require('../../config.js');
const passport = require('passport');
const { Strategy:LocalStrategy } = require('passport-local');
const { UserService }  = require('./users.service');
const securityUtils = require('../../utils/security')

/* Constants */
const userService = new UserService();

/* Passport Config */
passport.serializeUser(function(user, done) {
    debug('userCtrl:serializeUser', user)
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    debug('userCtrl:deserializeUser', id)
    userService.findById(id)
    .then((user) => done(null, user))
    .catch(done);
});

// Local strategy config (i.e., username/password, password is hashed and salted with bcrypt)
passport.use(new LocalStrategy(
    function(username, password, done) {
        userService.authenticate({username: username, password: password})
        .then((user) => done(null, user))
        .catch(done)
    }
));

/* Class */
class UserCtrl{
    addUser(req, res, next){
        userService.addUser(req.body)
        .then((resp) => res.json({msg: 'successfully added user', id: resp.id}))
        .catch(next)
    }

    authenticate(req, res, next){
      console.log('BASIC AUTH')
      passport.authenticate('local', function(err, user, info) {
        if( err ){
          return next(err);
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
            next();
        }
    }

    delete(req, res, next){
        // console.log('delete', req.body, req.user.id)
        if( req.user.id != req.body.id ){
            return next({
                err: 'wrongUserId',
                msg: "sorry, you can only delete YOUR user info, not someone else's"
            })
        }

        if( !req.body.username || !req.body.password ){
            return next({
                err: 'missingCredentials',
                msg: "credentials are required to confirm delete"
            })
        }

        if( req.user.username != req.body.username ){
            return next({
                err: 'incorrectUsername',
                msg: 'incorrect username'
            })
        }

        userService.validateUser(req.body)
        .then((resp) => {
            return userService.delete(req.body.id)
            .then((resp) => {
                if( !resp ) return next({err: 'deleteFailed', msg: 'Delete failed. Invalid user id?'})
                res.json({msg: 'succesfully deleted user ' + req.body.id})
            })
            .catch(next);
        }, next)
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
        debug('req.body', req.body)
        if( !req.body.name || req.body.name == '' ){
            res.status(401)
            .send('err...need to specify a client name')
            return;
        }

        var options = {
            server: {
                key: config.appServer.ssl.key,
                crt: config.appServer.ssl.cert
            },
            client: {
                privateKey: req.body.name + '.key',
                csr: req.body.name + '.csr',
                crt: req.body.name + '.crt',
                pem: req.body.name + '.pem',
                p12: req.body.name + '.p12',
                days: req.body.days || '365',
                name: req.body.name,
                emailAddress: req.body.emailAddress,
                organization: req.body.organization,
                organizationalUnit: req.body.organizationalUnit,
                countryCode: req.body.countryCode,
                state: req.body.state,
                city: req.body.city,
                exportPassphrase: req.body.pass || ''
            }
        }

        securityUtils.generateClientCert(options, (err) => {
            res.sendFile(options.client.p12, { root: '.' })
        })
    }

    updateUser(req, res, next){
        if( req.user.id != req.body.id ){
            return next({
                err: 'wrongUserId',
                msg: "sorry, you can only change YOUR user info, not someone else's"
            })
        }
        userService.update(req.body)
        .then((user) => res.json({msg: 'updated user successfully'}))
        .catch((err) => next(err));
    }

    validateClientCert(req, res, next){
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

}

exports.UserCtrl = UserCtrl;
