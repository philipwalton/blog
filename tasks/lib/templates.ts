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
import {addAsset, generateRevisionedAsset} from './assets.ts';
import {cssCache, jsCache} from './cache.ts';
import {bundleCSS} from './css.ts';
import {bundleJS} from './javascript.ts';
import {renderMarkdown} from './markdown.ts';
import {memoize, memoizeWithSrc, memoizeWithSrcCache} from './memoize.ts';

interface Config {
  contentPartialPath: string;
  contentPartialName: string;
  manifestFileName: string;
  publicDir: string;
  publicPath: string;
  publicStaticDir: string;
  publicStaticPath: string;
  publicModulesDir: string;
  publicModulesPath: string;
  templatesDir: string;
  timezone: string;
}

interface ImgProps {
  src: string;
  alt: string;
  border?: boolean;
  href?: string | false;
  figcaption?: string;
  figure?: boolean;
}

interface ScriptProps {
  entry: string;
}

interface StyleProps {
  entry: string;
  inline?: boolean;
}

interface NunjucksParser {
  nextToken: () => {value: string};
  parseSignature: (allowUnknown?: boolean, noParens?: boolean) => unknown;
  advanceAfterBlockEnd: (value?: string) => void;
  parseUntilBlocks: (header: string) => unknown;
}

interface NunjucksNodes {
  CallExtensionAsync: new (
    ext: object,
    method: string,
    args: unknown,
    content?: unknown[],
  ) => unknown;
}

const memoImgSize = memoize(promisify(imgSizePkg));
const memoBundleJS = memoizeWithSrcCache(jsCache, bundleJS);
const memoBundleCSS = memoizeWithSrcCache(cssCache, bundleCSS);
const memoGenerateRevisionedAsset = memoize(generateRevisionedAsset);
const memoOptimizeImage = memoizeWithSrc(
  (
    src: string,
    size: {width: number},
    format: keyof sharp.FormatEnum,
    opts?: Record<string, unknown>,
  ) => {
    return (
      (sharp(src).resize(size) as unknown as Record<string, Function>)[format]!(
        opts,
      ) as sharp.Sharp
    ).toBuffer();
  },
);

const config: Config = fs.readJSONSync('./config.json');

const generateLowResArticleImage = async (filename: string) => {
  const minified = await memoOptimizeImage(filename, {width: 700}, 'webp');
  const basename = path.basename(filename, path.extname(filename));

  return generateRevisionedAsset(`${basename}.webp`, minified);
};

const generateHighResArticleImage = async (filename: string) => {
  const minified = await memoOptimizeImage(filename, {width: 1400}, 'webp');
  const basename = path.basename(filename, path.extname(filename));

  return generateRevisionedAsset(`${basename}-1400w.webp`, minified);
};

/**
 * Nunjucks silently catches errors, which can make debugging incredibly hard.
 * This function logs errors so at least they're visible somewhere.
 */
const catchAndLogErrors = <A extends unknown[], R>(fn: (...args: A) => R) => {
  return (...args: A) => {
    try {
      return fn(...args);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };
};

export const initTemplates = () => {
  const env = nunjucks.configure('src/templates', {
    autoescape: false,
    noCache: true,
    watch: false,
    throwOnUndefined: true,
  });

  env.addFilter(
    'htmlescape',
    catchAndLogErrors((content: string) => {
      return he.encode(content, {useNamedReferences: true});
    }),
  );

  env.addFilter(
    'jsescape',
    catchAndLogErrors((content: string) => {
      return jsesc(content);
    }),
  );

  env.addFilter(
    'format',
    catchAndLogErrors((str: string, formatString: string) => {
      return moment.tz(str, config.timezone).format(formatString);
    }),
  );

  env.addFilter(
    'revision',
    catchAndLogErrors((filename: string) => {
      return memoGenerateRevisionedAsset(filename);
    }),
  );

  const inlineCache: Record<string, string> = {};
  env.addFilter(
    'inline',
    catchAndLogErrors((fileURL: string) => {
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
    new BlockShortcode('Callout', (content: string, type: string) => {
      const classes = ['Callout'];
      if (type) {
        classes.push(`Callout--${type}`);
      }
      return `<div class="${classes.join(' ')}">${renderMarkdown(content.trim())}</div>`;
    }),
  );

  env.addExtension(
    'Img',
    new InlineShortcode('Img', async (props: ImgProps) => {
      const {alt, border, figcaption, src} = props;
      let {href} = props;

      const filename = `src/images/articles/${props.src}`;
      const dimensions = await memoImgSize(filename);

      if (!dimensions || !dimensions.width || !dimensions.height) {
        throw new Error(`Could not determine dimensions for ${filename}`);
      }

      const width = Math.min(1400, dimensions.width);
      const height = Math.round(dimensions.height * (width / dimensions.width));

      const attrs: {
        src: string;
        width: number;
        height: number;
        alt: string;
        srcset?: string;
      } = {src, width, height, alt};

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
    new InlineShortcode('Script', async (props: ScriptProps) => {
      const {output} = await memoBundleJS(props.entry);
      const revisionedFilename = output[0].fileName;

      addAsset(props.entry, revisionedFilename, output[0].code);

      return `<script defer src="/static/${output[0].fileName}"></script>`;
    }),
  );

  env.addExtension(
    'Style',
    new InlineShortcode('Style', async (props: StyleProps) => {
      const {entry, inline} = props;
      const filePath = `./src/css/${entry}`;
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

function attrify(obj: Record<string, string | number | boolean | undefined>) {
  const attrs = [];
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
  _shortcodeFn: Function;
  _shortcodeName: string;
  tags: string[];

  constructor(shortcodeName: string, shortcodeFn: Function) {
    this._shortcodeFn = shortcodeFn;
    this._shortcodeName = shortcodeName;

    this.tags = [shortcodeName];
  }

  parse(parser: NunjucksParser, nodes: NunjucksNodes) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(true, true);
    parser.advanceAfterBlockEnd(tok.value);

    // const body = parser.parseUntilBlocks('end' + this._shortcodeName);
    // parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args);
  }

  async run(...args: unknown[]) {
    const done = args.pop() as nunjucks.Callback<unknown, unknown>;
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
  _shortcodeFn: Function;
  _shortcodeName: string;
  tags: string[];

  constructor(shortcodeName: string, shortcodeFn: Function) {
    this._shortcodeFn = shortcodeFn;
    this._shortcodeName = shortcodeName;

    this.tags = [shortcodeName];
  }

  parse(parser: NunjucksParser, nodes: NunjucksNodes) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(true, true);
    parser.advanceAfterBlockEnd(tok.value);

    const body = parser.parseUntilBlocks('end' + this._shortcodeName);
    parser.advanceAfterBlockEnd();

    return new nodes.CallExtensionAsync(this, 'run', args, [body]);
  }

  async run(...args: unknown[]) {
    const done = args.pop() as nunjucks.Callback<unknown, unknown>;
    const body = args.pop() as () => string;
    const [ctx, ...argArray] = args;

    const content = this._shortcodeFn.call(ctx, body(), ...argArray);

    done(null, new nunjucks.runtime.SafeString(content));
  }
}

export const renderTemplate = promisify(nunjucks.render) as (
  name: string,
  context?: object,
) => Promise<string>;

export const renderTemplateString = promisify(nunjucks.renderString) as (
  src: string,
  context?: object,
) => Promise<string>;
