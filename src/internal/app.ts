// Import dependencies
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import createError from 'http-errors';
import winston from 'winston';
import LokiTransport from 'winston-loki';
import fs from 'fs';
import compression from 'compression';
import rfs from 'rotating-file-stream';
import multer from 'multer';
import { enduranceEmitter, enduranceEventTypes } from '../core/emitter';
import { enduranceSwagger } from '../infra/swagger';
import { fileURLToPath } from 'url';

class EnduranceApp {
  public app: express.Application;
  private port: number | string;
  private loggerWinston: winston.Logger = winston.createLogger();
  private swaggerApiFiles: string[] = [];
  private __dirname: string;
  private isDirectUsage: boolean = false;
  private upload: multer.Multer;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    this.__dirname = path.dirname(__filename);
    this.app = express();
    this.port = process.env.SERVER_PORT || 3000; // Default port is 3000 if PORT env variable is not set

    // Configuration de multer pour les uploads de fichiers
    const storage = multer.diskStorage({
      destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
        // Trouver le chemin du projet parent (celui qui utilise endurance-core)
        const nodeModulesPath = this.__dirname.split('node_modules')[0];
        const projectRoot = path.dirname(nodeModulesPath);
        const uploadDir = path.join(projectRoot, 'uploads');

        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        console.log('Upload directory:', uploadDir);
        cb(null, uploadDir);
      },
      filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
        // Garder le nom original du fichier
        const originalName = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname);
        // Ajouter un suffixe unique à la fin
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${originalName}-${uniqueSuffix}${ext}`;
        console.log('Saving file:', filename);
        cb(null, filename);
      }
    });

    this.upload = multer({
      storage,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB par défaut
      }
    });

    // Vérifier si le module est utilisé directement (au premier niveau de node_modules)
    const nodeModulesCount = (this.__dirname.match(/node_modules/g) || []).length;
    this.isDirectUsage = nodeModulesCount === 1;

    // Initialiser l'application Express dans tous les cas
    this.app.set('port', this.port);
    this.setupMiddlewares();
    this.setupCors();
    this.setupLogging();
    this.setupRoutes().then(() => {
      this.setupErrorHandling();
      this.setupDatabase();
    });
  }

  private setupMiddlewares() {
    const payloadLimit = process.env.REQUEST_PAYLOAD_LIMIT || '50mb';

    // Middleware pour gérer différemment les requêtes multipart/form-data et JSON
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        next();
      } else {
        express.json({ limit: payloadLimit })(req, res, next);
      }
    });

    // On garde les autres middlewares
    this.app.use(express.urlencoded({ extended: false, limit: payloadLimit }));
    this.app.use(cookieParser());
    this.app.use(compression());
  }

  private setupCors() {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin) {
      const corsOptions: cors.CorsOptions = {
        origin: (origin, callback) => {
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
      this.app.use(cors(corsOptions));
      this.app.options('*', cors(corsOptions));
    }
  }

  private setupLogging() {
    if (process.env.LOGGER_LOCAL_ACTIVATED === 'true') {
      const logDirectory = path.join(this.__dirname, '../../../../logs');
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

      if (process.env.LOGGER_DISTANT_ACTIVATED === 'true') {
        const transports: winston.transport[] = [
          new winston.transports.Console()
        ];

        transports.push(
          new LokiTransport({
            host: process.env.LOGGER_DISTANT_URL || '',
            labels: { job: process.env.LOGGER_DISTANT_APP_NAME || 'nodejs_app' },
            json: true,
            onConnectionError: (err) => {
              console.error('Connection error with Loki:', err);
            }
          })
        );

        this.loggerWinston = winston.createLogger({
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
          transports
        });

        this.app.use(logger('combined', {
          stream: {
            write: (message: string) => {
              accessLogStream.write(message);
              this.loggerWinston.info(message.trim());
            }
          }
        }));
      }
    }
  }

  private async setupRoutes() {
    const extractVersion = (filename: string): string | null => {
      const match = filename.match(/v?(\d+\.\d+\.\d+|\d+)/);
      return match ? match[1] : null;
    };

    const loadRoutes = async (basePath: string, filePath: string, version: string | null) => {
      try {
        const { default: router } = await import('file:///' + filePath);
        const versionedPath = version ? `/v${version}${basePath}` : basePath;
        this.app.use(versionedPath, router.getRouter());
        this.swaggerApiFiles.push(filePath); // Add route file to Swagger API files list
      } catch (err) {
        console.error(`Error loading routes from ${filePath}:`, err);
      }
    };

    const loadServer = async () => {
      const isDirectory = (filePath: string): boolean => fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();

      const endsWith = (filePath: string, suffix: string): boolean => filePath.endsWith(suffix);
      const routesMap = new Map<string, Map<string, string>>();

      const processFile = async (folderPath: string, file: string) => {
        const filePath = path.join(folderPath, file);

        if (isDirectory(filePath)) {
          await readModulesFolder(filePath, filePath);
        } else if (endsWith(folderPath, 'public')) {
          this.app.use(express.static(folderPath));
        } else if (
          (endsWith(file, '.listener.js') && endsWith(folderPath, 'listeners')) ||
          (endsWith(file, '.consumer.js') && endsWith(folderPath, 'consumers')) ||
          (endsWith(file, '.middleware.js') && endsWith(folderPath, 'middlewares')) ||
          (endsWith(file, '.cron.js') && endsWith(folderPath, 'crons'))
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
          routesMap.get(basePath)!.set(version || 'default', filePath);
        }
      };

      const readModulesFolder = async (folderPath: string, overridePath: string) => {
        try {
          fs.readdirSync(folderPath).forEach(async (file) => {
            const filePath = path.join(folderPath, file);

            try {
              if (isDirectory(filePath)) {
                await readModulesFolder(filePath, overridePath);
              } else {
                if (overridePath && overridePath !== '' && fs.existsSync(path.join(overridePath, file))) {
                  await processFile(overridePath, file);
                } else {
                  await processFile(folderPath, file);
                }
              }
            } catch (err) {
              console.error(`Error processing file ${file}:`, err);
            }
          });
        } catch (err) {
          console.error('Error reading directory:', err);
        }
      };

      const loadMarketplaceModules = async () => {
        const nodeModulesPath = path.join(this.__dirname, '../../../../node_modules');
        const localModulesPath = path.join(this.__dirname, '../../../../modules');

        try {
          const moduleNames = fs.readdirSync(nodeModulesPath);
          for (const moduleName of moduleNames) {
            if (moduleName.startsWith('edrm-')) {
              console.log('Loading EDRM module: ', moduleName);
              const modulePath = path.join(nodeModulesPath, moduleName);
              const localModulePath = path.join(localModulesPath, moduleName);

              // Vérifier d'abord le nouveau chemin avec dist
              const distModulePath = path.join(modulePath, 'dist');

              if (isDirectory(distModulePath)) {
                try {
                  console.log('Loading from dist directory:', distModulePath);
                  await readModulesFolder(distModulePath, localModulePath);
                } catch (err) {
                  console.error(`Error reading module dist folder ${distModulePath}:`, err);
                }
              } else if (isDirectory(modulePath)) {
                // Fallback sur l'ancien chemin pour la rétrocompatibilité
                try {
                  console.log('Loading from standard directory:', modulePath);
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
      let modulesFolder = path.join(this.__dirname, '../../../../dist/modules');

      if (isDirectory(modulesFolder)) {
        await readModulesFolder(modulesFolder, '');
      } else {
        modulesFolder = path.join(this.__dirname, '../../../../src/modules');
        await readModulesFolder(modulesFolder, '');
      }

      for (const [basePath, versionsMap] of routesMap) {
        const sortedVersions = Array.from(versionsMap.keys()).sort((a, b) => {
          if (a === 'default') return -1;
          if (b === 'default') return 1;
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        for (let index = 0; index < sortedVersions.length; index++) {
          const version = sortedVersions[index];
          if (version === 'default') {
            await loadRoutes(basePath, versionsMap.get(version)!, null);
            console.log('Loaded routes :');
          } else {
            await loadRoutes(basePath, versionsMap.get(version)!, version);
          }

          if (index > 0) {
            const previousVersion = sortedVersions[index - 1];
            const fallbackPath = `/v${version}${basePath}`;
            const previousPath = `/v${previousVersion}${basePath}`;

            this.app.use(fallbackPath, (req: Request, res: Response, next: NextFunction) => {
              req.url = previousPath + req.url;
              next();
            });
          }
        }
      }

      this.app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.originalUrl === '/favicon.ico') {
          res.status(204).end(); // No Content
        } else {
          next();
        }
      });

      const enableSwagger = process.env.SWAGGER !== 'false';
      if (enableSwagger) {
        console.log(this.swaggerApiFiles);
        const swaggerSpec = enduranceSwagger.generateSwaggerSpec(this.swaggerApiFiles);
        await enduranceSwagger.setupSwagger(this.app, swaggerSpec);
      }

      if (process.env.NODE_ENV !== 'production') {
        this.app.get('/cause-error', (req: Request, res: Response) => {
          const error = new Error('Intentional error');
          (error as any).status = 500;
          res.status(500).json({ message: error.message });
        });
      }
    };

    await loadServer();
  }

  private setupErrorHandling() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(createError(404));
    });

    this.app.use((err: any, req: Request, res: Response) => {
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.render('error');
    });
  }

  private setupDatabase() {
    if (process.env.MONGODB_HOST) {
      import('../infra/database.js').then(({ enduranceDatabase }) => {
        this.app.use(
          session({
            secret: process.env.SESSION_SECRET || 'endurance',
            resave: false,
            saveUninitialized: false,
            store: enduranceDatabase.createStore()
          })
        );

        enduranceDatabase.connect()
          .then(() => {
            // Ne démarrer le serveur que si le module est utilisé directement
            if (this.isDirectUsage) {
              this.startServer();
            }
          })
          .catch((err: Error) => {
            console.error('Error connecting to MongoDB', err);
          });
      });
    } else {
      this.app.use(
        session({
          secret: process.env.SESSION_SECRET || 'endurance',
          resave: false,
          saveUninitialized: false,
          store: new session.MemoryStore()
        })
      );
      // Ne démarrer le serveur que si le module est utilisé directement
      if (this.isDirectUsage) {
        this.startServer();
      }
    }
  }

  private startServer() {
    console.log(`
      ______           _                                
     |  ____|         | |                               
     | |__   _ __   __| |_   _ _ __ __ _ _ __   ___ ___ 
     |  __| | '_ \\ / _\` | | | | '__/ _\` | '_ \\ / __/ _ \\
     | |____| | | | (_| | |_| | | | (_| | | | | (_|  __/
     |______|_| |_|\\__,_|\\__,_|_|  \\__,_|_| |_|\\___\\___|
                                                        
                                                        
    `);
    this.app.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
      enduranceEmitter.emit(enduranceEventTypes.APP_STARTED);
    });
  }

  // Méthode publique pour accéder à l'instance de multer
  public getUpload() {
    return this.upload;
  }
}

export default new EnduranceApp().app;
