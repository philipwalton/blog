import fs from 'fs-extra';
import gulp from 'gulp';
import path from 'path';
import {generateRevisionedAsset} from './utils/assets.js';
import {initBook} from './utils/book.js';
import {ENV} from './utils/env.js';
import {eachExperiment, getExperiment} from './utils/experiments.js';
import {processHtml} from './utils/html.js';
import {renderMarkdown} from './utils/markdown.js';
import {initTemplates, renderTemplate, renderTemplateString} from './utils/templates.js';


const config = fs.readJSONSync('./config.json');
let book;

const getExperimentDir = () => {
  const experiment = getExperiment();
  return path.join(config.publicDir, experiment ? `_${experiment}` : '.');
};

const renderArticleContentPartials = async () => {
  for (const article of book.articles) {
    const data = {
      ENV,
      EXPERIMENT: getExperiment(),
      site: book.site,
      page: article,
      layout: 'partial.html',
    };

    const markdown =
        await fs.readFile(`${article.path.slice(1, -1)}.md`, 'utf-8');

    article.markup = renderMarkdown(await renderTemplateString(markdown, data));
    article.content = await renderTemplate(article.template, data);
  }
};

const buildArticles = async () => {
  for (const article of book.articles) {
    await fs.outputFile(path.join(getExperimentDir(), article.partialFilePath),
        processHtml(article.content));

    const data = {
      ENV,
      EXPERIMENT: getExperiment(),
      site: book.site,
      page: {type: 'article', ...article},
      layout: 'shell.html',
    };
    const html = await renderTemplate(article.template, data);

    await fs.outputFile(
        path.join(getExperimentDir(), article.filePath), processHtml(html));
  }
};

const renderPageContentPartials = async () => {
  for (const page of book.pages) {
    if (!page.private) {
      const data = {
        EXPERIMENT: getExperiment(),
        site: book.site,
        articles: book.articles,
        page: page,
        layout: 'partial.html',
      };

      page.content = await renderTemplate(page.template, data);
    }
  }
};

const buildPages = async () => {
  for (const page of book.pages) {
    // Private pages are those that cannot be found by following a link on the
    // site, and thus no content partial needs to be created for them.
    if (!page.private) {
      const partialFilePath =
          path.join(getExperimentDir(), page.partialFilePath);

      await fs.outputFile(partialFilePath, processHtml(page.content));
    }

    const data = {
      ENV,
      EXPERIMENT: getExperiment(),
      site: book.site,
      articles: book.articles,
      page: page,
      layout: 'shell.html',
    };

    const html = await renderTemplate(page.template, data);
    const filePath = path.join(getExperimentDir(), page.filePath);
    await fs.outputFile(filePath, processHtml(html));
  }
};

const buildResources = async () => {
  const data = {
    site: book.site,
    articles: book.articles,
  };
  for (const resource of book.resources) {
    const content = await renderTemplate(resource.template, data);
    await fs.outputFile(
        path.join(config.publicDir, resource.filePath), content);
  }
};

const buildShell = async () => {
  // html-minifier breaks when trying to minify partial HTML, so we have to
  // render the shell as a full page, minify it, and then split it up.
  const SHELL_SPLIT_POINT = 'SHELL_SPLIT_POINT';
  const experiment = getExperiment();

  const data = {
    ENV,
    EXPERIMENT: experiment,
    site: book.site,
    articles: book.articles,
    page: {
      path: '',
      private: true,
      content: SHELL_SPLIT_POINT,
    },
    layout: 'shell.html',
  };

  const html = await renderTemplate('shell.html', data);
  const processedHtml = processHtml(html);

  const [shellStart, shellEnd] = processedHtml.split(SHELL_SPLIT_POINT);

  await Promise.all([
    generateRevisionedAsset('shell-start.html', shellStart, experiment),
    generateRevisionedAsset('shell-end.html', shellEnd, experiment),
  ]);
};


gulp.task('content', async () => {
  book = await initBook();
  initTemplates();

  try {
    await eachExperiment(async () => {
      await renderArticleContentPartials();
      await buildArticles();

      await renderPageContentPartials();
      await buildPages();

      await buildShell();
    });

    await buildResources();
  } catch (err) {
    console.error(err);
  }
});
