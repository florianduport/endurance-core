const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

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
    return require(swaggerConfigPath);
  }
  return defaultOptions;
};

const options = loadOptions();

const generateSwaggerSpec = (apiFiles) => {
  options.apis = apiFiles;
  return swaggerJsdoc(options);
};

module.exports = {
  generateSwaggerSpec,
  setupSwagger: (app, swaggerSpec) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  },
};
