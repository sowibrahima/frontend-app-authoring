const path = require('path');
const { createConfig } = require('@openedx/frontend-build');
const stripWutiskillParagonTheme = require('./webpack.wutiskill-theme');

const config = createConfig('webpack-dev', {
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src/'),
            CourseAuthoring: path.resolve(__dirname, 'src/'),
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
