const fs = require('fs-extra');
const he = require('he');
const jsesc = require('jsesc');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const {getRevisionedAssetUrl} = require('./assets');
const config = require('../../config.json');

/**
 * Nunjucks silently catches errors, which can make debugging incredibly hard.
 * This function logs errors so at least they're visible somewhere.
 * @param {Function} fn
 * @return {Function}
 */
const catchAndLogErrors = (fn) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      // eslint-disable-next-line
      console.error(err);
      process.exit(1);
    }
  };
};


const initTemplates = () => {
  const env = nunjucks.configure('templates', {
    autoescape: false,
    noCache: true,
    watch: false,
    throwOnUndefined: true,
  });

  env.addFilter('htmlescape', catchAndLogErrors((content) => {
    return he.encode(content, {useNamedReferences: true});
  }));

  env.addFilter('jsescape', catchAndLogErrors((content) => {
    return jsesc(content);
  }));

  env.addFilter('format', catchAndLogErrors((str, formatString) => {
    return moment.tz(str, config.timezone).format(formatString);
  }));

  env.addFilter('revision', catchAndLogErrors((filename) => {
    return getRevisionedAssetUrl(filename);
  }));

  const inlineCache = {};
  env.addFilter('inline', catchAndLogErrors((filepath) => {
    if (!inlineCache[filepath]) {
      inlineCache[filepath] = fs.readFileSync(`build/${filepath}`, 'utf-8');
    }
    return inlineCache[filepath];
  }));
};

module.exports = {initTemplates};
