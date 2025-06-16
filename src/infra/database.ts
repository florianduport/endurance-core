import mongoose, { ConnectOptions } from 'mongoose';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

const MongoDBStore = connectMongoDBSession(session);

/* eslint-disable no-var, no-unused-vars */
declare global {
  var __MONGO_CONNECTED__: boolean | undefined;
}
/* eslint-enable no-var, no-unused-vars */

class EnduranceDatabase {
  private requiredEnvVars: string[] = [
    'MONGODB_USERNAME',
    'MONGODB_PASSWORD',
    'MONGODB_HOST',
    'MONGODB_DATABASE'
  ];

  public checkRequiredEnvVars(): void {
    this.requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable not set`);
      }
    });
  }

  private getDbConnectionString(): string {
    this.checkRequiredEnvVars();

    const {
      MONGODB_USERNAME,
      MONGODB_PASSWORD,
      MONGODB_HOST,
      MONGODB_DATABASE
    } = process.env;

    const MONGODB_PROTOCOL = process.env.MONGODB_PROTOCOL || 'mongodb+srv';
    return `${MONGODB_PROTOCOL}://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`;
  }

  public async connect(): Promise<typeof mongoose> {
    const connectionString = this.getDbConnectionString();
    const host = new URL(connectionString).host;

    console.log('[endurance-core] Connexion à MongoDB sur :', host);

    const options: ConnectOptions = {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      ssl: process.env.MONGODB_SSL === 'true'
    };

    if (
      (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 3) ||
      global.__MONGO_CONNECTED__
    ) {
      console.log('[endurance-core] Connexion MongoDB déjà établie. Skip.');
      return mongoose;
    }

    try {
      const conn = await mongoose.connect(connectionString, options);
      global.__MONGO_CONNECTED__ = true;
      console.log('[endurance-core] ✅ MongoDB connecté avec succès');
      return conn;
    } catch (err) {
      console.error('[endurance-core] ❌ Échec connexion MongoDB :', err);
      throw err;
    }
  }

  public createStore(): session.Store {
    const uri = this.getDbConnectionString();

    const store = new MongoDBStore({
      uri,
      collection: 'sessions'
    });

    store.on('error', (error: Error) => {
      console.error('[endurance-core] Erreur du store de session MongoDB :', error);
    });

    return store;
  }
}

export const enduranceDatabase = new EnduranceDatabase();
