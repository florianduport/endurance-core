const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);


const getDbConnectionString = () => {
  const requiredEnvVars = ['MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_HOST', 'MONGODB_DATABASE'];
  const envVars = {};
  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar];
    if (!value) {
      throw new Error(`${envVar} environment variable not set`);
    }
    envVars[envVar] = value;
  });

  const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DATABASE } = envVars;
  return `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`;
};

const connect = () => {
  const connectionString = getDbConnectionString();

  return mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
  });
};

const createStore = () => {
  const uri = getDbConnectionString();

  const store = new MongoDBStore({
    uri,
    collection: "sessions",
  });

  store.on('error', (error) => {
    console.error('Session store error:', error);
  });

  return store;
};

module.exports = {
  connect,
  createStore,
};
