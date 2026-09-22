const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

config.watchFolders = [
  projectRoot,
  path.join(projectRoot, 'node_modules'),
];

module.exports = config;

