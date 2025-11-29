const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

// Map react-native-worklets -> react-native-worklets-core to satisfy plugins that require it
let extraNodeModules = {};
try {
  const corePkg = require.resolve('react-native-worklets-core/package.json');
  extraNodeModules['react-native-worklets'] = path.dirname(corePkg);
} catch (e) {
  // ignore if core not installed; shim approach may be used
}

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    extraNodeModules,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...config.resolver.sourceExts, 'svg'],
  },
};
