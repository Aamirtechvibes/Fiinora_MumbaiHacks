module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: [
      // Add optional chaining transform (if needed)
      "@babel/plugin-transform-optional-chaining",
    ],
  };
};
