// Import dependencies
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'cors... Remove this comment to see the full error message
import cors from 'cors';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'cook... Remove this comment to see the full error message
import cookieParser from 'cookie-parser';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'morg... Remove this comment to see the full error message
import logger from 'morgan';
import createError from 'http-errors';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import fs from 'fs';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'comp... Remove this comment to see the full error message
import compression from 'compression';
import rfs from 'rotating-file-stream';
import { emitter, eventTypes } from './emitter';
import { generateSwaggerSpec, setupSwagger } from './swagger';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.SERVER_PORT || 3000; // Default port is 3000 if PORT env variable is not set
app.set('port', port);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const corsOptions = {
    origin: (origin: any, callback: any) => {
      if (!origin || corsOrigin === '*' || corsOrigin.split(',').includes(origin)) {
        callback(null, true); // Authorized
      } else {
        callback(new Error('CORS unauthorized')); // Rejected
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
}

const logDirectory = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDirectory)) {
  try {
    fs.mkdirSync(logDirectory);
  } catch (err) {
    console.error('Error creating log directory:', err);
  }
}
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
});

const transports = [
  new winston.transports.Console()
];

if (process.env.LOGGER_DISTANT_ACTIVATED === 'true') {
  transports.push(
    // @ts-expect-error TS(2345): Argument of type 'LokiTransport' is not assignable... Remove this comment to see the full error message
    new LokiTransport({
      // @ts-expect-error TS(2322): Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
      host: process.env.LOGGER_DISTANT_URL, // Full URL with http and port
      labels: { job: process.env.LOGGER_DISTANT_APP_NAME || 'nodejs_app' },
      json: true,
      onConnectionError: (err) => {
        console.error('Connection error with Loki:', err);
      }
    })
  );
}

const loggerWinston = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});

app.use(logger('combined', {
  stream: {
    write: (message: any) => {
      accessLogStream.write(message);
      loggerWinston.info(message.trim());
    }
  }
}));

const swaggerApiFiles: any = [];

// Utility function to extract version from filename
const extractVersion = (filename: any) => {
  const match = filename.match(/v?(\d+\.\d+\.\d+|\d+)/);
  return match ? match[1] : null;
};

// Load routes based on version
const loadRoutes = async (app: any, basePath: any, filePath: any, version: any) => {
  try {
    const { default: router } = await import('file:///' + filePath);
    const versionedPath = version ? `/v${version}${basePath}` : basePath;
    app.use(versionedPath, router);
    console.log('loaded route');
    swaggerApiFiles.push(filePath); // Add route file to Swagger API files list
  } catch (err) {
    console.error(`Error loading routes from ${filePath}:`, err);
  }
};

const loadServer = async (loadModels: any) => {
  const isDirectory = (filePath: any) => fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();

  const endsWith = (filePath: any, suffix: any) => filePath.endsWith(suffix);
  const routesMap = new Map();

  const processFile = async (folderPath: any, file: any) => {
    const filePath = path.join(folderPath, file);

    if (isDirectory(filePath)) {
      // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
      await readModulesFolder(filePath);
    } else if (endsWith(folderPath, 'public')) {
      app.use(express.static(folderPath));
    } else if (
      (endsWith(file, '.listener.js') && endsWith(folderPath, 'listeners')) ||
      (endsWith(file, '.consumer.js') && endsWith(folderPath, 'consumers')) ||
      (endsWith(file, '.middleware.js') && endsWith(folderPath, 'middlewares')) ||
      (endsWith(file, '.cron.js') && endsWith(folderPath, 'crons')) ||
      (endsWith(file, '.model.js') && endsWith(folderPath, 'models') && loadModels)
    ) {
      try {
        await import('file:///' + filePath);
      } catch (err) {
        console.error(`Error loading file ${filePath}:`, err);
      }
    } else if (endsWith(file, '.router.js') && endsWith(folderPath, 'routes')) {
      const routerName = path.basename(file, '.router.js');
      const version = extractVersion(routerName);
      const basePath = `/${routerName.replace(`.${version}`, '')}`;

      if (!routesMap.has(basePath)) {
        routesMap.set(basePath, new Map());
      }
      routesMap.get(basePath).set(version || 'default', filePath);
    }
  };

  const processFileTS = async (folderPath: any, file: any) => {
    const filePath = path.join(folderPath, file);

    if (isDirectory(filePath)) {
      await readModulesFolderTS(filePath);
    } else if (endsWith(folderPath, 'public')) {
      app.use(express.static(folderPath));
    } else if (
      (endsWith(file, '.listener.js') && endsWith(folderPath, 'listeners')) ||
      (endsWith(file, '.consumer.js') && endsWith(folderPath, 'consumers')) ||
      (endsWith(file, '.middleware.js') && endsWith(folderPath, 'middlewares')) ||
      (endsWith(file, '.cron.js') && endsWith(folderPath, 'crons')) ||
      (endsWith(file, '.model.js') && endsWith(folderPath, 'models') && loadModels)
    ) {
      try {
        await import('file:///' + filePath);
      } catch (err) {
        console.error(`Error loading file ${filePath}:`, err);
      }
    } else if (endsWith(file, '.router.js') && endsWith(folderPath, 'routes')) {
      const routerName = path.basename(file, '.router.js');
      const version = extractVersion(routerName);
      const basePath = `/${routerName.replace(`.${version}`, '')}`;

      if (!routesMap.has(basePath)) {
        routesMap.set(basePath, new Map());
      }
      routesMap.get(basePath).set(version || 'default', filePath);
    }
  };

  const readModulesFolder = async (folderPath: any, overridePath: any) => {
    try {
      fs.readdirSync(folderPath).forEach(async (file) => {
        const filePath = path.join(folderPath, file);
        const overrideFilePath = path.join(overridePath, file);

        try {
          if (isDirectory(filePath)) {
            await readModulesFolder(filePath, overrideFilePath);
          } else if (fs.existsSync(overrideFilePath)) {
            await processFile(overridePath, file);
          } else {
            await processFile(folderPath, file);
          }
        } catch (err) {
          console.error(`Error processing file ${file}:`, err);
        }
      });
    } catch (err) {
      console.error('Error reading directory:', err);
    }
  };

  const readModulesFolderTS = async (folderPath: any) => {
    try {
      const distPath = path.join(folderPath, 'dist');
      if (isDirectory(distPath)) {
        fs.readdirSync(distPath).forEach(async (file) => {
          try {
            await processFileTS(distPath, file);
          } catch (err) {
            console.error(`Error processing file ${file} in distPath:`, err);
          }
        });
      } else {
        fs.readdirSync(folderPath).forEach(async (file) => {
          try {
            await processFileTS(folderPath, file);
          } catch (err) {
            console.error(`Error processing file ${file} in folderPath:`, err);
          }
        });
      }
    } catch (err) {
      console.error('Error reading directory:', err);
    }
  };

  // Function to load "edrm-" prefixed modules and allow for file-by-file overriding
  const loadMarketplaceModules = async () => {
    const nodeModulesPath = path.join(__dirname, '../../../node_modules');
    const localModulesPath = path.join(__dirname, '../../../modules');

    try {
      const moduleNames = fs.readdirSync(nodeModulesPath);
      for (const moduleName of moduleNames) {
        if (moduleName.startsWith('edrm-')) {
          console.log('Loading EDRM module: ', moduleName);
          const modulePath = path.join(nodeModulesPath, moduleName);
          const localModulePath = path.join(localModulesPath, moduleName);

          if (isDirectory(modulePath)) {
            try {
              await readModulesFolder(modulePath, localModulePath);
            } catch (err) {
              console.error(`Error reading module folder ${modulePath}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error reading node modules directory:', err);
    }
  };

  // Load the marketplace modules
  await loadMarketplaceModules();

  // Load modules from the local modules folder
  const modulesFolder = path.join(__dirname, '../../../modules');
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 2.
  await readModulesFolderTS(modulesFolder, modulesFolder);

  for (const [basePath, versionsMap] of routesMap) {
    const sortedVersions = Array.from(versionsMap.keys()).sort((a, b) => {
      if (a === 'default') return -1;
      if (b === 'default') return 1;
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    for (let index = 0; index < sortedVersions.length; index++) {
      const version = sortedVersions[index];
      if (version === 'default') {
        await loadRoutes(app, basePath, versionsMap.get(version), null);
        console.log('loaded default route');
      } else {
        await loadRoutes(app, basePath, versionsMap.get(version), version);
      }

      // Set up fallback to previous versions if not defined
      if (index > 0) {
        const previousVersion = sortedVersions[index - 1];
        const fallbackPath = `/v${version}${basePath}`;
        const previousPath = `/v${previousVersion}${basePath}`;

        app.use(fallbackPath, (req: any, res: any, next: any) => {
          req.url = previousPath + req.url;
          next();
        });
      }
    };
  };

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl === '/favicon.ico') {
      res.status(204).end(); // No Content
    } else {
      next();
    }
  });

  const enableSwagger = process.env.SWAGGER !== 'false';
  if (enableSwagger) {
    // Swagger setup
    console.log(swaggerApiFiles);
    const swaggerSpec = generateSwaggerSpec(swaggerApiFiles);
    await setupSwagger(app, swaggerSpec); // Ensure setupSwagger is awaited
  }

  if (process.env.NODE_ENV !== 'production') {
    app.get('/cause-error', (req, res, next) => {
      console.log('cause-error');
      const error = new Error('Intentional error');
      (error as any).status = 500;
      res.status(500).json({ message: error.message });
    });
  }

  // catch 404 and forward to error handler
  app.use(function (req: any, res: any, next: any) {
    next(createError(404));
  });

  // error handler
  app.use(function (err: any, req: any, res: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  console.log(`Server listening on port ${port}`);
  // @ts-expect-error TS(2339): Property 'APP_STARTED' does not exist on type '{}'... Remove this comment to see the full error message
  emitter.emit(eventTypes.APP_STARTED);
};

if (process.env.MONGODB_HOST) {
  // Import lib
  import('./database.js').then(({ connect, createStore }) => {
    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'endurance',
        resave: false,
        saveUninitialized: false,
        store: createStore()
      })
    );

    connect()
      .then(() => {
        loadServer(true);
      })
      .catch((err: any) => {
        console.error('Error connecting to MongoDB', err);
      });
  });
} else {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'endurance',
      resave: false,
      saveUninitialized: false,
      store: new session.MemoryStore()
    })
  );
  loadServer(false);
}

export default app;
