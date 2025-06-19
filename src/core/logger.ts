import fs from 'fs';
import path from 'path';
import pino from 'pino';
import pinoCaller from 'pino-caller';
import rfs from 'rotating-file-stream';

// ✅ Create logs dir
const logDirectory = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// ✅ Transports à activer selon config
const targets: any[] = [];

// Console (pretty)
targets.push({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{msg}'
    },
    level: process.env.LOG_LEVEL || 'info'
});

// Fichier local
if (process.env.LOGGER_LOCAL_ACTIVATED === 'true') {
    targets.push({
        target: 'pino/file',
        options: {
            destination: path.join(logDirectory, 'app.log')
        },
        level: 'info'
    });
}

// Loki distant
if (process.env.LOGGER_DISTANT_ACTIVATED === 'true') {
    const lokiOptions: any = {
        host: process.env.LOGGER_DISTANT_URL || '',
        labels: {
            job: process.env.LOGGER_DISTANT_APP_NAME || 'nodejs_app'
        }
    };

    if (process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD) {
        lokiOptions.basicAuth = {
            username: process.env.LOKI_USERNAME,
            password: process.env.LOKI_PASSWORD
        };
    }

    if (process.env.LOKI_TOKEN) {
        lokiOptions.headers = {
            Authorization: `Bearer ${process.env.LOKI_TOKEN}`
        };
    }

    console.log('Loki options:', lokiOptions);
    targets.push({
        target: 'pino-loki',
        options: lokiOptions,
        level: 'info'
    });
}

// Création du transport combiné
const transport = pino.transport({
    targets
});

// ✅ Création du logger avec transport multi-sortie
const baseLogger = pino(
    {
        level: process.env.LOG_LEVEL || 'info'
    },
    transport
);

// Ajout du caller
const logger = pinoCaller(baseLogger, {
  relativeTo: process.cwd()
});

// Rediriger console.* vers logger
console.log = (...args) => logger.info(args.join(' '));
console.info = (...args) => logger.info(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));
console.debug = (...args) => logger.debug(args.join(' '));

// Morgan stream
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: logDirectory
});

export const morganStream = {
    write: (message: string) => {
        accessLogStream.write(message);
        logger.info(message.trim());
    }
};

export default logger;
