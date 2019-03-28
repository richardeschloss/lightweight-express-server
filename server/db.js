const { MongoStorage } = require('./utils/storage');

const mongoStorage = new MongoStorage();

exports.connect = () => mongoStorage.connect();
exports.disconnect = () => mongoStorage.disconnect();
