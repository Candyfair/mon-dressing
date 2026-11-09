module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Inlines the Drizzle migration .sql files into the bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
