const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const stripWutiskillParagonTheme = require('./webpack.wutiskill-theme');

const config = createConfig('webpack-prod', {
  resolve: {
    alias: {
      // Within this app, we can use '@src/foo instead of relative URLs like '../../../foo'
      '@src': path.resolve(__dirname, 'src/'),
      // Plugins can use 'CourseAuthoring' as an import alias for this app:
      CourseAuthoring: path.resolve(__dirname, 'src/'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-intl': path.resolve(__dirname, 'node_modules/react-intl'),
      '@edx/frontend-platform': path.resolve(__dirname, 'node_modules/@edx/frontend-platform'),
      '@openedx/paragon': path.resolve(__dirname, 'node_modules/@openedx/paragon'),
    },
    fallback: {
      fs: false,
      constants: false,
    },
  },
});

stripWutiskillParagonTheme(config);

module.exports = config;
