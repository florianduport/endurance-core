import mongoose, { ConnectOptions } from 'mongoose';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

const MongoDBStore = connectMongoDBSession(session);

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

  private getDbConnectionString() {
    // ATLAS Cloud variables
    if (
      process.env.MONGODB_HOST &&
      process.env.MONGODB_HOST.includes('.mongodb.net')
    ) {
      const requiredEnvVars = [
        'MONGODB_USERNAME',
        'MONGODB_PASSWORD',
        'MONGODB_HOST',
        'MONGODB_DATABASE'
      ];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) throw new Error(`${envVar} not set`);
      }
      const {
        MONGODB_USERNAME,
        MONGODB_PASSWORD,
        MONGODB_HOST,
        MONGODB_DATABASE
      } = process.env;
      const MONGODB_PROTOCOL = process.env.MONGODB_PROTOCOL || 'mongodb+srv';
      return `${MONGODB_PROTOCOL}://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`;
    }

    // Otherwise, fallback on internal mongo (DBMONGO_)
    const requiredEnvVars = [
      'DBMONGO_USERNAME',
      'DBMONGO_PASSWORD',
      'DBMONGO_HOSTNAME',
      'DBMONGO_PATH',
      'DBMONGO_PORT'
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) throw new Error(`${envVar} not set`);
    }
    const {
      DBMONGO_USERNAME,
      DBMONGO_PASSWORD,
      DBMONGO_HOSTNAME,
      DBMONGO_PATH,
      DBMONGO_PORT
    } = process.env;
    const MONGODB_PROTOCOL = process.env.MONGODB_PROTOCOL || 'mongodb';
    return `${MONGODB_PROTOCOL}://${DBMONGO_USERNAME}:${DBMONGO_PASSWORD}@${DBMONGO_HOSTNAME}:${DBMONGO_PORT}/${DBMONGO_PATH}`;
  }

  public connect(): Promise<typeof mongoose> {
    const connectionString = this.getDbConnectionString();

    return mongoose.connect(connectionString, {
      connectTimeoutMS: 30000
    } as ConnectOptions);
  }

  public createStore(): session.Store {
    const uri = this.getDbConnectionString();

    const store = new MongoDBStore({
      uri,
      collection: 'sessions'
    });

    store.on('error', (error: Error) => {
      console.error('Session store error:', error);
    });

    return store;
  }
}

export const enduranceDatabase = new EnduranceDatabase();
