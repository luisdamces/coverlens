// Metro debe reconocer .wasm como asset (expo-sqlite en web). Sin esto aparece
// "Unable to resolve module ... wa-sqlite.wasm".
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
