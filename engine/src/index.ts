// Entry point that registers path mappings before starting the server
const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Register tsconfig-paths with the proper base URL for production
// This file will be compiled to dist/index.js, so the base is the dist folder itself
const baseUrl = __dirname;

tsConfigPaths.register({
  baseUrl,
  paths: {
    "@/*": ["*"],
    "@shared/*": ["types/shared/*"],
    "@core/*": ["core/*"],
    "@api/*": ["api/*"],
    "@websocket/*": ["websocket/*"],
    "@utils/*": ["utils/*"],
    "@config/*": ["config/*"]
  }
});

// Now import and start the server
require('./server');