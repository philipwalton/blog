import fs from 'fs-extra';
import path from 'path';

const config = fs.readJSONSync('./config.json');

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

export const getOutputFile = (pathname) => {
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }

  return path.resolve(path.join(config.publicDir, pathname));
};

const getPartialOutputFile = (outputFile) => {
  return path.join(path.dirname(outputFile), config.contentPartialName);
};

const getPartialPath = (pathname) => {
  return path.join(pathname, config.contentPartialName);
};

export const initBook = async () => {
  const book = await fs.readJSON('./book.json');

  for (const page of book.pages) {
    page.template = getTemplate(page.path);
    page.output = getOutputFile(page.path);

    // Private pages are those that cannot be found by following a link on the
    // site, and thus no content partial needs to be created for them.
    if (!page.private) {
      page.partialPath = getPartialPath(page.path);
      page.partialOutput = getPartialOutputFile(page.output);
    }
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

  book.site.buildTime = new Date();

  return book;
};
