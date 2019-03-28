/* Requires */
const argv = require('minimist')(process.argv.slice(2))

const serverOptions = {
    proto: argv.proto || 'https',
    host: argv.host || 'localhost',
    port: argv.port || 8080,
    browser: argv.browser
}
