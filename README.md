# lightweight-express-server
Lightweight Express Server (seriously lightweight)

## Description
Lightweight express server has the very basic setup to spin up either an http, https, or spdy (http2) server without the bloat of generated code.
Left lightweight so that you can customize as you wish, with comments to help guide you. This is not a binary, it's the source code that you can toy with.

## Plain-jane usage 
First, clone the repo... (you know the drill, git clone.. npm install...)

Then you can spin up the server from the command-line:
> npm start # starts up the http server on localhost at 8080 (test: http://localhost:8080 )

> npm run debug # starts up the http server in "debug mode"

> node utils/security.js --action generateSelfSignedCert (generates a self-signed cert, saves the keys to localhost.key and localhost.crt respectively. No server is started here)

> node server.js --proto https --browser chromium (starts up an https server and auto-loads* the start page in chromium...well, there's a gotcha...chromium has to trust the cert)

> node server.js --proto http2 (starts up a spdy server, but in the browser, you still have to prefix the URL with "https://" not "http2://" or "spdy://")

## So you want to use self-signed cert?? Are you sure? 
If you don't import your self-signed cert and set it as trusted, your browser won't trust the https/http2 server and you won't see index.html (which is actually a good thing the browser is doing!)
But, since you're developing on your local machine, and you probably trust your machine (and yourself), you can circumvent this safeguard by importing the cert:

In chrome, you go to chrome://settings/certificates, select "Authorities" tab --> import... --> [find your localhost.crt file that was created by the --genSSL option]...

After importing, chromium will still say localhost is Untrusted (hey, that's pretty good if you think about it!)
But, if you want to trust that cert, you have one more step to do, which is to click on the localhost cert you just imported, click "Edit..." and then check all the "Trust..." checkboxes.
Now, navigating to your https url will work and the browser will say it's secure (well, not really, you just labeled it as "secure")
