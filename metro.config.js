const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = [
  "react-native",
  "browser",
  "module",
  "main"
];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  ws: path.resolve(__dirname, "src/shims/ws.js")
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "ws") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "src/shims/ws.js")
    };
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
