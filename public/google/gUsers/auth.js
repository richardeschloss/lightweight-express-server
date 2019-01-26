"use strict";

class GoogleClient{
    constructor(cfg){
        this.auth2 = {};
        this.signinBtn = cfg.signinBtn;
        this.signoutBtn = cfg.signoutBtn;
        this.successRedirect = cfg.successRedirect;
        this.failureRedirect = cfg.failureRedirect;
        this.signoutRedirect = cfg.signoutRedirect;

        this.avatarImgElem = cfg.avatarImgElem;
        this.avatarElem = cfg.avatarElem;
    }

    authSuccess(googleUser){
        console.log('authSuccess', this.authSuccess);
        var profile = googleUser.getBasicProfile();
        var id_token = googleUser.getAuthResponse().id_token;
        this.printProfile(profile);
        this.verifyToken(id_token, profile);
    }

    authFailure(error){
        alert(JSON.stringify(error, undefined, 2));
    }

    async load(){
        var self = this;
        var clientInfo = await $.get('/google/gUsers/auth/getClientID')
        gapi.load('auth2', function(){
            // Retrieve the singleton for the GoogleAuth library and set up the client.
            gapi.auth2.init({
                client_id: clientInfo.CLIENT_ID,
                cookiepolicy: 'single_host_origin',
                // Request scopes in addition to 'profile' and 'email'
                //scope: 'additional_scope'
            }).then((auth2) => {
                self.auth2 = auth2;
                if( self.signinBtn ){
                    self.auth2.attachClickHandler(
                        self.signinBtn,
                        {},
                        (r) => { self.authSuccess(r) },
                        (e) => { self.authFailure(e) }
                    )
                }

                if( self.signoutBtn ){ // TBD: I think this belongs somewhere else...
                    self.signoutBtn.addEventListener('click', () => {
			// uncomment, eventually:
			// var auth2 = gapi.auth2.getAuthInstance();
                        auth2.signOut()
                        .then((resp) => {
                            console.log('user signed out')
                            location.pathname = self.signoutRedirect;
                        });
                    })
                }

                self.loadUserInfo();
            });
        });
    }

    loadUserInfo(){
        var googleUser = this.auth2.currentUser.get();
        var profile = googleUser.getBasicProfile();
        if( profile ){
            if( this.signinBtn ){
                location.pathname = this.successRedirect;
                return;
            }
            this.printProfile(profile)
            this.styleAvatar(profile)
        } else {
            location.pathname = this.signoutRedirect;
        }
    }

    printProfile(profile){
        console.log('Full Name: ' + profile.getName());
        console.log('Given Name: ' + profile.getGivenName());
        console.log('Family Name: ' + profile.getFamilyName());
        console.log("Image URL: " + profile.getImageUrl());
        console.log("Email: " + profile.getEmail());
    }

    styleAvatar(profile){
        if( this.avatarImgElem ) this.avatarImgElem.src = profile.getImageUrl();
        if( this.avatarElem ) this.avatarElem.innerText = profile.getName();
    }

    verifyToken(id_token, profile){
        var self = this;
        $.post('/google/gUsers/auth/validateClient', {
            idToken: id_token
        })
        .then((response) => {
            console.log('Server verified...signed in as: ' + profile.getName());
        })
        .catch(console.error)
    }
}
