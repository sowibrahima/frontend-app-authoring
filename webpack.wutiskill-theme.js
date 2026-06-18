const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const PARAGON_THEME_DEFINITION = JSON.stringify({});
const THEME_REFERENCE_PATTERN = /\b(paragon|brand)(?:[._\-/\\]?theme)?\b|paragon\.theme|brand\.theme/i;

function findPackageRoot(config) {
  const candidates = [
    config?.context,
    __dirname,
    process.cwd(),
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(path.join(candidate, 'package.json'))) || __dirname;
}

function getAppRequire(config) {
  return createRequire(path.join(findPackageRoot(config), 'package.json'));
}

function optionalRequire(appRequire, request) {
  try {
    return appRequire(request);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    return null;
  }
}

function valueContainsThemeReference(value) {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(valueContainsThemeReference);
  }

  const valueString = value.toString ? value.toString() : '';
  return THEME_REFERENCE_PATTERN.test(valueString);
}

function cacheGroupContainsThemeReference(key, cacheGroup) {
  return [
    key,
    cacheGroup?.name,
    cacheGroup?.test,
    cacheGroup?.chunks,
    cacheGroup?.filename,
    cacheGroup?.idHint,
  ].some(valueContainsThemeReference);
}

function isParagonWebpackPlugin(plugin, ParagonWebpackPlugin) {
  if (!plugin) {
    return false;
  }

  return Boolean(
    (ParagonWebpackPlugin && plugin instanceof ParagonWebpackPlugin)
    || plugin.pluginName === 'ParagonWebpackPlugin'
    || plugin.constructor?.pluginName === 'ParagonWebpackPlugin'
    || plugin.constructor?.name === 'ParagonWebpackPlugin',
  );
}

function setParagonThemeDefinition(config, appRequire) {
  const webpack = appRequire('webpack');
  let updatedExistingDefinition = false;

  config.plugins = config.plugins || [];
  config.plugins.forEach((plugin) => {
    if (
      plugin?.definitions
      && Object.prototype.hasOwnProperty.call(plugin.definitions, 'PARAGON_THEME')
    ) {
      plugin.definitions.PARAGON_THEME = PARAGON_THEME_DEFINITION;
      updatedExistingDefinition = true;
    }
  });

  if (!updatedExistingDefinition) {
    config.plugins.push(
      new webpack.DefinePlugin({
        PARAGON_THEME: PARAGON_THEME_DEFINITION,
      }),
    );
  }
}

function suppressDevWarningOverlay(config) {
  if (!config.devServer) {
    return;
  }

  const client = config.devServer.client || {};
  const overlay = typeof client.overlay === 'object' && client.overlay !== null
    ? client.overlay
    : {};

  config.devServer.client = {
    ...client,
    overlay: {
      ...overlay,
      errors: true,
      warnings: false,
    },
  };
}

function stripWutiskillParagonTheme(config) {
  const appRequire = getAppRequire(config);
  const ParagonWebpackPlugin = optionalRequire(
    appRequire,
    '@openedx/frontend-build/lib/plugins/paragon-webpack-plugin/ParagonWebpackPlugin',
  );

  if (config.entry && typeof config.entry === 'object' && !Array.isArray(config.entry)) {
    Object.keys(config.entry).forEach((key) => {
      if (key.startsWith('paragon.theme') || key.startsWith('brand.theme')) {
        delete config.entry[key];
      }
    });
  }

  config.plugins = (config.plugins || []).filter(
    plugin => !isParagonWebpackPlugin(plugin, ParagonWebpackPlugin),
  );

  setParagonThemeDefinition(config, appRequire);

  if (config.optimization?.splitChunks?.cacheGroups) {
    Object.keys(config.optimization.splitChunks.cacheGroups).forEach((key) => {
      if (cacheGroupContainsThemeReference(key, config.optimization.splitChunks.cacheGroups[key])) {
        delete config.optimization.splitChunks.cacheGroups[key];
      }
    });
  }

  if (config.module?.rules) {
    config.module.rules = config.module.rules.map((rule) => {
      if (!rule.oneOf) {
        return rule;
      }

      return {
        ...rule,
        oneOf: rule.oneOf.filter((oneOfRule) => !(
          valueContainsThemeReference(oneOfRule.resource)
          || valueContainsThemeReference(oneOfRule.include)
          || valueContainsThemeReference(oneOfRule.issuer)
          || valueContainsThemeReference(oneOfRule.test)
          || valueContainsThemeReference(oneOfRule.name)
        )),
      };
    });
  }

  suppressDevWarningOverlay(config);

  return config;
}

module.exports = stripWutiskillParagonTheme;
