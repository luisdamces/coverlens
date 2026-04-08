/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Metro no lee tsconfig paths; alinear @/ con compilerOptions.paths.
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          root: ['./'],
          alias: { '@': './' },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      // Debe ir el último: worklets/reanimated dependen del transform en dev y en export:embed.
      'react-native-reanimated/plugin',
    ],
  };
};
