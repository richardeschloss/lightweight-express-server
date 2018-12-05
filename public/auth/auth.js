"use strict";

class GoogleClient{
    constructor(cfg){
        this.CLIENT_ID = '742894255659-33r2knrd7rarbv8c9pg9mkjsbiina5g2.apps.googleusercontent.com';
        this.auth2 = {};
        this.signinBtn = cfg.signinBtn;
        this.signoutBtn = cfg.signoutBtn;
        this.successRedirect = cfg.successRedirect;
        this.failureRedirect = cfg.failureRedirect;
        this.signoutRedirect = cfg.signoutRedirect;
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

    load(){
        var self = this;
        gapi.load('auth2', function(){
            // Retrieve the singleton for the GoogleAuth library and set up the client.
            gapi.auth2.init({
                client_id: self.CLIENT_ID,
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

                if( self.signoutBtn ){
                    self.loadUserInfo();
                    self.signoutBtn.addEventListener('click', () => {
                        auth2.signOut()
                        .then((resp) => {
                            console.log('user signed out')
                            location.pathname = self.signoutRedirect;
                        });
                    })
                }
            })

        });
    }

    loadUserInfo(){
        var googleUser = this.auth2.currentUser.get();
        var profile = googleUser.getBasicProfile();
        if( !profile ){
            location.pathname = this.signoutRedirect;
            return;
        }
        this.printProfile(profile)
        this.styleAvatar(profile)
    }

    printProfile(profile){
        console.log('Full Name: ' + profile.getName());
        console.log('Given Name: ' + profile.getGivenName());
        console.log('Family Name: ' + profile.getFamilyName());
        console.log("Image URL: " + profile.getImageUrl());
        console.log("Email: " + profile.getEmail());
    }

    styleAvatar(profile){
        document.getElementById('avatar_img').src = profile.getImageUrl();
        document.getElementById('avatar_name').innerText = profile.getName();
    }

    verifyToken(id_token, profile){
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '../users/googleClient');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if( xhr.status == 200 ){
                console.log('Server verified...signed in as: ' + profile.getName());
                location.pathname = self.successRedirect;
            } else {
                location.pathname = self.failureRedirect;
            }
        };
        xhr.send('idToken=' + id_token);
    }
}
