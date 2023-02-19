const webpack = require("webpack");

module.exports = function override(config, env) {
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    })
  );
  config.resolve.fallback = { buffer: require.resolve("buffer/") };
  return config;
};
