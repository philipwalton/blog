import fs from 'fs-extra';
import he from 'he';
import jsesc from 'jsesc';
import moment from 'moment-timezone';
import nunjucks from 'nunjucks';
import path from 'path';
import resolve from 'resolve';
import {promisify} from 'util';
import {getRevisionedAssetUrl} from './assets.js';
import {renderMarkdown} from './markdown.js';


const config = fs.readJSONSync('./config.json');

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

export const initTemplates = () => {
  const modulepreload = fs.readJsonSync(
      path.join(config.publicDir, 'modulepreload.json'));

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

  env.addFilter('modulepreload', catchAndLogErrors((entryModule) => {
    return modulepreload[entryModule].map((importedModule) => {
      return path.join(config.publicModulesPath, importedModule);
    });
  }));

  const inlineCache = {};
  env.addFilter('inline', catchAndLogErrors((fileURL) => {
    if (!inlineCache[fileURL]) {
      // Inline from node_modules with the `npm:` prefix,
      // otherwise inline from the build directory.
      const assetPath = fileURL.startsWith('npm:') ?
          resolve.sync(fileURL.slice(4)) :
          path.join(config.publicDir, fileURL.slice(1));

      inlineCache[fileURL] = fs.readFileSync(assetPath, 'utf-8');
    }
    return inlineCache[fileURL];
  }));

  env.addExtension('Callout', new Shortcode('Callout', (content, type) => {
    const classes = ['Callout'];
    if (type) {
      classes.push(`Callout--${type}`);
    }
    return `<div class="${classes.join(' ')}">${
      renderMarkdown(content.trim(), {highlight: false})
    }</div>`;
  }));
};

/**
 * Class to create new Nunjucks shortcode blocks.
 */
class Shortcode {
  /**
   * @param {string} shortcodeName
   * @param {Function} shortcodeFn
   */
  constructor(shortcodeName, shortcodeFn) {
    this._shortcodeFn = shortcodeFn;
    this._shortcodeName = shortcodeName;

    this.tags = [shortcodeName];
  }

  /**
   * @param {Object} parser Nunjucks object
   * @param {Object} nodes Nunjucks object
   * @returns {any}
   */
  parse(parser, nodes) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(true, true);
    parser.advanceAfterBlockEnd(tok.value);

    const body = parser.parseUntilBlocks('end' + this._shortcodeName);
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  /**
   * @param  {...any} args Parser params
   */
  async run(...args) {
    const done = args.pop();
    const body = args.pop();
    const [ctx, ...argArray] = args;

    const content = this._shortcodeFn.call(ctx, body(), ...argArray);

    done(null, new nunjucks.runtime.SafeString(content));
  }
}

export const renderTemplate = promisify(nunjucks.render);
export const renderTemplateString = promisify(nunjucks.renderString);
