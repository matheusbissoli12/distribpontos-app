// Ignora a pasta do app de desktop (Electron) no bundler do Expo.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const desktop = escape(path.resolve(__dirname, 'desktop'));
config.resolver.blockList = [new RegExp(`^${desktop}[\\\\/].*`)];

module.exports = config;
