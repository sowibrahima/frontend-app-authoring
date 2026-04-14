const webpack = require('webpack');
const ParagonWebpackPlugin = require('@openedx/frontend-build/lib/plugins/paragon-webpack-plugin/ParagonWebpackPlugin');

function valueContainsThemeReference(value) {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(valueContainsThemeReference);
  }

  const valueString = value.toString ? value.toString() : '';
  return valueString.includes('paragon') || valueString.includes('brand');
}

function stripWutiskillParagonTheme(config) {
  if (config.entry && typeof config.entry === 'object' && !Array.isArray(config.entry)) {
    Object.keys(config.entry).forEach((key) => {
      if (key.startsWith('paragon.theme') || key.startsWith('brand.theme')) {
        delete config.entry[key];
      }
    });
  }

  config.plugins = (config.plugins || []).filter(
    plugin => !(plugin instanceof ParagonWebpackPlugin),
  );

  config.plugins.push(
    new webpack.DefinePlugin({
      PARAGON_THEME: JSON.stringify({}),
    }),
  );

  if (config.optimization?.splitChunks?.cacheGroups) {
    Object.keys(config.optimization.splitChunks.cacheGroups).forEach((key) => {
      if (key.startsWith('paragon') || key.startsWith('brand')) {
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

  return config;
}

module.exports = stripWutiskillParagonTheme;
