const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const config = require('../../config.json');
const {getManifest} = require('./assets');


const getTemplate = (pathname) => {
  let templateFile;

  if (pathname == '/') {
    templateFile = 'index.html';
  } else if (pathname.endsWith('/')) {
    templateFile = `${pathname.slice(0, -1)}.html`;
  } else {
    templateFile = pathname;
  }

  return path.basename(templateFile);
};


const getOutputFile = (pathname) => {
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }

  return path.resolve(path.join(config.publicDir, pathname));
};


const getPartialOutputFile = (outputFile) => {
  const basename = path.basename(outputFile, '.html');
  return path.join(
      path.dirname(outputFile), `${basename}${config.contentPartialsSuffix}`);
};


const getPartialPath = (pathname) => {
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }
  const extname = path.extname(pathname);
  const basename = path.basename(pathname, extname);
  const dirname = path.dirname(pathname);

  return path.join(dirname, basename + config.contentPartialsSuffix);
};


const initBook = async () => {
  const book = yaml.safeLoad(await fs.readFile('./book.yaml', 'utf-8'));

  for (const page of book.pages) {
    page.template = getTemplate(page.path);
    page.output = getOutputFile(page.path);
    page.partialPath = getPartialPath(page.path);
    page.partialOutput = getPartialOutputFile(page.output);
  }

  for (const resource of book.resources) {
    resource.template = getTemplate(resource.path);
    resource.output = getOutputFile(resource.path);
  }

  for (const article of book.articles) {
    article.template = 'article.html';
    article.output = getOutputFile(article.path);
    article.partialPath = getPartialPath(article.path);
    article.partialOutput = getPartialOutputFile(article.output);
  }

  const assetManifest = getManifest();

  book.site.buildTime = new Date();
  book.site.assets = {
    modules: Object.keys(assetManifest)
        .filter((entry) => entry.match(/\.mjs$/)),
  };

  // TODO(philipwalton): sometimes the build doesn't contain modules. I'm not
  // sure why, but it should fail if that ever happens.
  if (!(book.site.assets.modules && book.site.assets.modules.length > 0)) {
    throw new Error('No modules added to book.');
  }

  return book;
};

module.exports = {getOutputFile, initBook};
