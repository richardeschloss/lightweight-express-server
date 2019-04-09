# lightweight-express-server
![img](https://raw.githubusercontent.com/richardeschloss/lightweight-express-server/gh-pages/assets/lightweight-express-server_graphic.png)

Lightweight Express Server (seriously lightweight)... umm hmm, well, the first version was very lightweight and the most recent version is still relatively lightweight...(the latest release grew into what it is for good reason...)

## Description
Lightweight express server has the very basic setup to spin up either an http, https, or spdy (http2) server. I will plug in http3 when that becomes ready and stable :). Also comes with a handy server-side CLI.

Think of this as http-server on steroids. http-server is great for getting up and running with front-end development in pretty much any folder on your machine. However, there may be a point where you require much greater control over the backend (caching, auth, etc) and this project can be a great starting point for most Express-based web apps.

This is not a binary, it's the source code that you can toy with. Whether you want to run the app in docker containers or on your filesystem not is purely up to you. You have the options. (But, if you spin up docker containers, make sure your `node_modules` folder is non-existent)

## Setup
### 1. First step is to clone this repo:

> $ git clone https://github.com/richardeschloss/lightweight-express-server.git

### 2. This project gives you TWO options:

#### a) Running the server on your local machine:
##### a.1. Pre-requisites:

-- Install [NodeJS](https://nodejs.org/en/download/)

-- Install [MongoDB Community Edition](https://www.mongodb.com/download-center/community) (i.e., click "Server" tab, then download)

-- Run the mongod binary, or if it's set up to run as service, start it:

> $ sudo service mongod start

(example for Debian-based systems)   

##### a.2. Install the app's dependencies:
This will install dependencies listed in `package.json`
>  $ npm i

##### a.3. Update the `server/config.js` file as needed.
It's highly recommended to update the credentials, and to git ignore and git remove this file. For now, start with the protocol to 'http'. Also leave mongoClient.ssl as is (set to false) for now. Secured transports will be explained a little bit later.

##### a.4. Run the automated tests:
This will test some basic app routes, such as '/': (hit ctrl+c to stop; to bail out of the file-watcher, even after tests run)

>  $ npm run test_module

##### a.5. Run the server in dev mode :
This will restart when you make changes to the codebase

> $ npm run dev

##### a.6. You should now see your server at: http://localhost:8000

If you see a MongoNetworkError in the terminal, you just need to make sure you configured your mongo server and client correctly. Even with the Mongo connection error, you should still be able to see the homepage, since the server won't
exit on db connection errors; you just won't be able to do much that involves persistence until you fix the db connection.

#### b) Using Docker containers:
##### b.1. Pre-requisites:

-- Install [Docker community edition](https://hub.docker.com/search/?type=edition&offering=community) and [Docker-Compose](https://docs.docker.com/compose/install)

That's it! one of the reasons people like Docker...the basic idea is..."what I see on my machine is *exactly* what you're supposed to see on your machine"

##### b.2. Update the `.env` file with the config settings of your choosing.
It's a very good idea to update the credentials! NOTE: to get up and going quickly, leave the protocol to 'http' for now. Also leave `MONGOD_TLS_ENABLED=false` for now. Secured transports will be explained a bit more later.

##### b.3. Install and start everything from one command!
Make sure your in the working directory...the level which has the `docker-compose.yml` file in it. This will pull nodejs, mongo and create three separate containers: one for the server, one for the database, one for the tests. It will also install all necessary dependencies.

> docker-compose up

##### b.4. If all went well, you should see `mocha_tests` reporting passing tests
Cool, right? But, if you don't trust the automated tests, navigate to your app server and check manually: http://localhost:8081

Yes, the front-end isn't all too exciting, but it's a starting point for you to go on and do AWESOME things!

##### b.5. Now, if you make changes to the codebase, a file watcher (`nodemon`) is watching those changes and restarting both the server and the tests.
You may find the continuous testing to be extremely useful if you can get used to *test-driven development*. However, you may not be ready for this kind of development, or you may find the constant testing to be annoying. No worries, all that's needed is to open a separate terminal and run:

> docker stop mocha_tests

Then, to restart tests, it's as simple as:

> docker start mocha_tests

#####  b.6. You may find it useful to shell into any of the containers to troubleshoot. For example:
Bash was installed when `docker-compose` was first run. This command will start the container `lightweight_express_server` in interactive (`--it` mode) and run `bash` (shell):

> docker exec -it lightweight_express_server bash

From the shell, you can use the server-cli.

### 3. Using the CLI (server-cli.js).
This assumes nodejs binary is at `/usr/local/bin/node`. If it's not there, just prefix these commands with `node `.

* Start a server using defaults:

    > $ ./server/server-cli.js

* Start a server over https:

    > $ ./server/server-cli.js --proto=https

    It should be noted that authentication routes are ONLY supported over secure transports. Login will not work over http by design.

* Serve a front end located somewhere else on your machine:

    > server/server-cli.js --frontend_root=/path/to/your/frontend

* Generate a self-signed cert:

    > $ ./server/server-cli.js --action=generateSelfSignedCert --crt=./.ssl/server.crt --key=./.ssl/server.key

    You will probably want to import this cert into your browser so that you can navigate to your website via https without encountering the security warnings. This is for dev purposes only! Normally you would never use self-signed certs in production. In chrome, you would go to chrome://settings/certificates --> "Authorities" tab --> import --> select the server.crt file, and when prompted, it's sufficient click the check box that says "Trust this certificate for identifying websites".

* View the self-signed cert:

    > $ ./server/server-cli.js --action=viewCertificate --crt=./.ssl/server.crt

 * Generate a client cert:
   This will create myClient.p12 which the client "myClient" can use to login to your app (see below)

    > ./server/server-cli.js --action=generateClientCert --name=myClient

    Alternatively, just generate the client cert from the basic html web form (easier). This will send the cert and the browser will auto-download it.
    https://localhost:8081/auth/generateClientCert.html

    To use this client cert, import it to your browser and then just refresh the front end. In Chrome, for example, go to chrome://settings/certificates --> then "Your Certificates" --> Import --> select the client cert (.p12 file) you generated. Now refresh your front-end and you should be prompted to select the cert! Click the Login with "Client Certificate" button and you should see "Hello [client name], your certificate was issued by ([server])!"

  * Generate certs for mongo TLS/SSL transport (dev purposes, mainly):

    > $ ./server/server-cli.js --action=generateMongoCerts

    Then, to actually use these certs, set MONGOD_TLS_ENABLED to true in `.env`, (or set ssl to "true" in `server/config.json`). This will instruct the mongo client to connect with the cert. To instruct the mongo server to requireTLS, simply find the tls block in `mongod.conf` and update the network interfaces as follows: (of course, restart server / mongod for changes to take effect! Don't forget that...)

    ```
    ...
    # network interfaces
    net:
      port: 27017
      bindIp: 127.0.0.1

    # Uncomment when ready to use
    #  tls:
    #    mode: requireTLS
    #    certificateKeyFile: /etc/mongod/mongod.pem
    #    CAFile: /etc/mongod/mongoClient.pem
    ...
    ```

## Credits
* Marko Klemetti (@mrako) - for the wait-For.sh script
* Kathleen Juell (@katjuell) - for the helpful docs at Digital Ocean

## Like what you see? Want it to be better?
Donations welcome (eventually, once I get the button on here)
