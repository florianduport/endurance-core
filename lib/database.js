const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const connect = () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const database = process.env.MONGODB_DATABASE;

  const connectionString = `mongodb+srv://${username}:${password}@${host}/${database}`;

  return mongoose.connect(connectionString, {
    useNewUrlParser: true,
    connectTimeoutMS: 30000,
  });
};


const createStore = () => {
  if(!process.env.MONGODB_HOST){
    throw new Error("MONGODB_HOST environment variable not set");
  } else if(!process.env.MONGODB_DATABASE){
    throw new Error("MONGODB_DATABASE environment variable not set");
  } else if(!process.env.MONGODB_USERNAME){
    throw new Error("MONGODB_USERNAME environment variable not set");
  } else if(!process.env.MONGODB_PASSWORD){
    throw new Error("MONGODB_PASSWORD environment variable not set");
  }
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;
  const database = process.env.MONGODB_DATABASE;

  const store = new MongoDBStore({
    uri: `mongodb+srv://${username}:${password}@${host}/${database}`,
    collection: "sessions",
  });

  return store;
};

module.exports = {
  connect,
  createStore,
};
