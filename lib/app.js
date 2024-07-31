// Import dependencies
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const createError = require("http-errors");
const fs = require("fs");
const compression = require("compression");
const rfs = require("rotating-file-stream");
const { loadCrons } = require("./cron");
const { emitter, eventTypes } = require("./emitter");


const app = express();

const port = process.env.SERVER_PORT || 3000; // Default port is 3000 if PORT env variable is not set
app.set("port", port);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

// Set up logging
const logDirectory = path.join(__dirname, "../../../logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});
app.use(logger("combined", { stream: accessLogStream }));

const loadServer = (loadModels) => {

    
  // Set up crons
  loadCrons();


  app.set("views", path.join(__dirname, "views"));
  
  
  const isDirectory = (filePath) => fs.statSync(filePath).isDirectory();
  const endsWith = (filePath, suffix) => filePath.endsWith(suffix);
  
  const processFile = (folderPath, file) => {
    const filePath = path.join(folderPath, file);
  
    if (isDirectory(filePath)) {
      readModulesFolder(filePath);
    } else if (endsWith(folderPath, "public")) {
      app.use(express.static(folderPath));
    } else if ((endsWith(file, ".listener.js") && endsWith(folderPath, "listeners")) ||
               (endsWith(file, ".model.js") && endsWith(folderPath, "models") && loadModels)) {
      require(filePath);
    } else if (endsWith(file, ".router.js") && endsWith(folderPath, "routes")) {
      const routerName = path.basename(file, ".router.js");
      const router = require(filePath);
      app.use(`/${routerName}`, router);
    }
  };
  
  const readModulesFolder = (folderPath) => {
    fs.readdirSync(folderPath).forEach((file) => {
      processFile(folderPath, file);
    });
  };
  
  // Specify the path to your modules folder
  const modulesFolder = path.join(__dirname, "../../../modules");
  readModulesFolder(modulesFolder);
  
  
  app.use((req, res, next) => {
    if (req.originalUrl === '/favicon.ico') {
      res.status(204).end(); // No Content
    } else {
      next();
    }
  });

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });

  console.log(`Server listening on port ${port}`);
  emitter.emit(eventTypes.APP_STARTED);
}


if (process.env.MONGODB_URI) {
  // Import lib
const { connect, createStore } = require("./database");
app.use(
  session({
    secret: process.env.SESSION_SECRET || "endurance",
    resave: false,
    saveUninitialized: false,
    store: createStore(),
  })
);

  connect()
    .then(() => {
      loadServer(true);
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB", err);
    });
} else {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "endurance",
      resave: false,
      saveUninitialized: false,
      store: new session.MemoryStore(),
    })
  );
  loadServer(false);
}


module.exports = app;
