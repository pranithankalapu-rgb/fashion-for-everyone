const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const realRoot = path.resolve('c:/Users/prani/OneDrive/Desktop/fashion-for-everyone/mobile');

config.watchFolders = [
  projectRoot,
  realRoot,
  path.join(realRoot, 'node_modules'),
  path.join(projectRoot, 'node_modules'),
];

module.exports = config;
