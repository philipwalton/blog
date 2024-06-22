import {oneLine} from 'common-tags';
import fs from 'fs-extra';
import he from 'he';
import imgSizePkg from 'image-size';
import jsesc from 'jsesc';
import moment from 'moment-timezone';
import nunjucks from 'nunjucks';
import path from 'path';
import resolve from 'resolve';
import sharp from 'sharp';
import {promisify} from 'util';
import {addAsset, generateRevisionedAsset} from './assets.js';
import {cssCache, jsCache} from './cache.js';
import {bundleCSS} from './css.js';
import {bundleJS} from './javascript.js';
import {renderMarkdown} from './markdown.js';
import {memoize, memoizeWithSrc, memoizeWithSrcCache} from './memoize.js';

const memoImgSize = memoize(promisify(imgSizePkg));
const memoBundleJS = memoizeWithSrcCache(jsCache, bundleJS);
const memoBundleCSS = memoizeWithSrcCache(cssCache, bundleCSS);
const memoGenerateRevisionedAsset = memoize(generateRevisionedAsset);
const memoOptimizeImage = memoizeWithSrc((src, size, format, opts) => {
  return sharp(src).resize(size)[format](opts).toBuffer();
});

const config = fs.readJSONSync('./config.json');

const generateLowResArticleImage = async (filename) => {
  const minified = await memoOptimizeImage(filename, {width: 700}, 'webp');
  const basename = path.basename(filename, path.extname(filename));

  return generateRevisionedAsset(`${basename}.webp`, minified);
};

const generateHighResArticleImage = async (filename) => {
  const minified = await memoOptimizeImage(filename, {width: 1400}, 'webp');
  const basename = path.basename(filename, path.extname(filename));

  return generateRevisionedAsset(`${basename}-1400w.webp`, minified);
};

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
  const env = nunjucks.configure('templates', {
    autoescape: false,
    noCache: true,
    watch: false,
    throwOnUndefined: true,
  });

  env.addFilter(
    'htmlescape',
    catchAndLogErrors((content) => {
      return he.encode(content, {useNamedReferences: true});
    }),
  );

  env.addFilter(
    'jsescape',
    catchAndLogErrors((content) => {
      return jsesc(content);
    }),
  );

  env.addFilter(
    'format',
    catchAndLogErrors((str, formatString) => {
      return moment.tz(str, config.timezone).format(formatString);
    }),
  );

  env.addFilter(
    'revision',
    catchAndLogErrors((filename) => {
      return memoGenerateRevisionedAsset(filename);
    }),
  );

  const inlineCache = {};
  env.addFilter(
    'inline',
    catchAndLogErrors((fileURL) => {
      if (!inlineCache[fileURL]) {
        // Inline from node_modules with the `npm:` prefix,
        // otherwise inline from the build directory.
        const assetPath = fileURL.startsWith('npm:')
          ? resolve.sync(fileURL.slice(4))
          : path.join(config.publicDir, fileURL.slice(1));

        inlineCache[fileURL] = fs.readFileSync(assetPath, 'utf-8');
      }
      return inlineCache[fileURL];
    }),
  );

  env.addExtension(
    'Callout',
    new BlockShortcode('Callout', (content, type) => {
      const classes = ['Callout'];
      if (type) {
        classes.push(`Callout--${type}`);
      }
      return `<div class="${classes.join(' ')}">${renderMarkdown(
        content.trim(),
        {highlight: false},
      )}</div>`;
    }),
  );

  env.addExtension(
    'Img',
    new InlineShortcode('Img', async (props) => {
      let {alt, border, href, figcaption, src} = props;

      const filename = `assets/images/articles/${props.src}`;

      const dimensions = await memoImgSize(filename);
      const width = Math.min(1400, dimensions.width);
      const height = Math.round(dimensions.height * (width / dimensions.width));

      const attrs = {src, width, height, alt};

      if (filename.match(/\.(png|jpg)$/)) {
        const [highResSrc, lowResSrc] = await Promise.all([
          generateHighResArticleImage(filename),
          generateLowResArticleImage(filename),
        ]);

        href = href ?? highResSrc;
        attrs.srcset = `${highResSrc}, ${lowResSrc} 700w`;
        attrs.src = lowResSrc;
      } else {
        attrs.src = generateRevisionedAsset(
          path.basename(filename),
          await fs.readFile(filename),
        );
        href = href ?? attrs.src;
      }

      let html = `<img ${attrify(attrs)}>`;

      if (props.href !== false) {
        html = `<a href="${href}">${html}</a>`;
      }

      if (props.figure !== false) {
        html = `<figure ${border ? '' : 'noborder'}>
          ${html}
          ${figcaption ? `<figcaption>${figcaption}</figcaption>` : ''}
        </figure>`;
      }

      return oneLine(html);
    }),
  );

  env.addExtension(
    'Script',
    new InlineShortcode('Script', async (props) => {
      const {output} = await memoBundleJS(props.entry);
      const revisionedFilename = output[0].fileName;

      addAsset(props.entry, revisionedFilename, output[0].code);

      return `<script defer src="/static/${output[0].fileName}"></script>`;
    }),
  );

  env.addExtension(
    'Style',
    new InlineShortcode('Style', async (props) => {
      const {entry, inline} = props;
      const filePath = `./assets/css/${entry}`;
      const css = await memoBundleCSS(filePath);

      if (inline) {
        return `<style>${css}</style>`;
      } else {
        const revisionedFilePath = await generateRevisionedAsset(
          path.basename(filePath),
          css,
        );

        return `<link rel="stylesheet" href="${revisionedFilePath}">`;
      }
    }),
  );
};

function attrify(obj) {
  let attrs = [];
  for (const [attr, value] of Object.entries(obj)) {
    if (value && !attr.startsWith('_')) {
      attrs.push(`${attr}="${value}"`);
    }
  }
  return attrs.join(' ');
}

/**
 * Class to create new Nunjucks shortcode blocks.
 */
class InlineShortcode {
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

    // const body = parser.parseUntilBlocks('end' + this._shortcodeName);
    // parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args);
  }

  /**
   * @param  {...any} args Parser params
   */
  async run(...args) {
    const done = args.pop();
    // const body = args.pop();
    const [ctx, ...argArray] = args;

    const content = await this._shortcodeFn.call(ctx, ...argArray);

    done(null, new nunjucks.runtime.SafeString(content));
  }
}

/**
 * Class to create new Nunjucks shortcode blocks.
 */
class BlockShortcode {
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
