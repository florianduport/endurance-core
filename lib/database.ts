import mongoose from "mongoose";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";

const MongoDBStore = connectMongoDBSession(session);

const requiredEnvVars = ['MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_HOST', 'MONGODB_DATABASE'];

const checkRequiredEnvVars = () => {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} environment variable not set`);
    }
  });
};

const getDbConnectionString = () => {
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

export { connect, createStore, checkRequiredEnvVars };
