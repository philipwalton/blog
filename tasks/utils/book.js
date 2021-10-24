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

  return pathname;
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


export const initBook = async () => {
  const book = await fs.readJSON('./book.json');

  for (const page of book.pages) {
    page.template = getTemplate(page.path);
    page.filePath = getOutputFile(page.path);

    if (!page.private) {
      page.partialFilePath = getPartialPath(page.path);
    }
  }

  for (const resource of book.resources) {
    resource.template = getTemplate(resource.path);
    resource.filePath = getOutputFile(resource.path);
  }

  for (const article of book.articles) {
    article.template = 'article.html';
    article.filePath = getOutputFile(article.path);

    if (!article.private) {
      article.partialFilePath = getPartialPath(article.path);
    }
  }

  book.site.buildTime = new Date();

  return book;
};
