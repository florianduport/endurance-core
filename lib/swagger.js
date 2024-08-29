import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Endurance API',
      version: '1.0.0',
      description: 'Description of the Endurance API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
  }
};

const loadOptions = () => {
  const swaggerConfigPath = path.resolve(__dirname, '../../../swagger.json');
  if (fs.existsSync(swaggerConfigPath)) {
    return import(swaggerConfigPath);
  }
  return defaultOptions;
};

const options = await loadOptions();

const generateSwaggerSpec = (apiFiles) => {
  options.apis = apiFiles;
  return swaggerJsdoc(options);
};

const setupSwagger = (app, swaggerSpec) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export {
  generateSwaggerSpec,
  setupSwagger,
};
