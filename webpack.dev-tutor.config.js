const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const stripWutiskillParagonTheme = require('./webpack.wutiskill-theme');

const config = createConfig('webpack-dev', {
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src/'),
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

config.devServer = config.devServer || {};
config.devServer.client = config.devServer.client || {};
config.devServer.client.overlay = {
    errors: true,
    warnings: false,
};

module.exports = config;
