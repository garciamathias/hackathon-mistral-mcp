const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// Register tsconfig-paths with the proper base URL for production
const baseUrl = path.join(__dirname, 'dist');

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