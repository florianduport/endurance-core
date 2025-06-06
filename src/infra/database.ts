import mongoose, { ConnectOptions } from 'mongoose';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

const MongoDBStore = connectMongoDBSession(session);

class EnduranceDatabase {
  private requiredEnvVars: string[] = ['MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_HOST', 'MONGODB_DATABASE'];

  public checkRequiredEnvVars(): void {
    this.requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable not set`);
      }
    });
  }

  private getDbConnectionString(): string {
    const envVars: Record<string, string> = {};
    this.requiredEnvVars.forEach((envVar) => {
      const value = process.env[envVar];
      if (!value) {
        throw new Error(`${envVar} environment variable not set`);
      }
      envVars[envVar] = value;
    });

    const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DATABASE } = envVars;
    return `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}/${MONGODB_DATABASE}`;
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
