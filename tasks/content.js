const fs = require('fs-extra');
const gulp = require('gulp');
const nunjucks = require('nunjucks');
const path = require('path');

const {initBook} = require('./utils/book');
const {processHtml} = require('./utils/html');
const {renderMarkdown} = require('./utils/markdown');
const {initTemplates} = require('./utils/templates');

let book;

const renderArticleContentPartials = async () => {
  for (const article of book.articles) {
    const data = {
      ENV: process.env.NODE_ENV,
      site: book.site,
      page: article,
      layout: 'partial.html',
    };

    const markdown =
        await fs.readFile(`${article.path.slice(1, -1)}.md`, 'utf-8');

    article.markup = renderMarkdown(nunjucks.renderString(markdown, data));
    article.content = nunjucks.render(article.template, data);
    // article.hash = hash(article.content);
  }
};

const buildArticles = async () => {
  for (const article of book.articles) {
    await fs.outputFile(article.partialOutput, processHtml(article.content));

    const data = {
      ENV: process.env.NODE_ENV,
      site: book.site,
      page: article,
      layout: 'shell.html',
    };
    const html = nunjucks.render(article.template, data);

    await fs.outputFile(article.output, processHtml(html));
  }
};

const renderPageContentPartials = async () => {
  for (const page of book.pages) {
    if (!page.private) {
      const data = {
        site: book.site,
        articles: book.articles,
        page: page,
        layout: 'partial.html',
      };

      page.content = nunjucks.render(page.template, data);
      // page.hash = hash(page.content);
    }
  }
};

const buildPages = async () => {
  for (const page of book.pages) {
    // Private pages are those that cannot be found by following a link on the
    // site, and thus no content partial needs to be created for them.
    if (!page.private) {
      await fs.outputFile(page.partialOutput, processHtml(page.content));
    }

    const data = {
      ENV: process.env.NODE_ENV,
      site: book.site,
      articles: book.articles,
      page: page,
      layout: 'shell.html',
    };

    const html = nunjucks.render(page.template, data);
    await fs.outputFile(page.output, processHtml(html));
  }
};

const buildResources = async () => {
  const data = {
    site: book.site,
    articles: book.articles,
  };
  for (const resource of book.resources) {
    const content = nunjucks.render(resource.template, data);
    await fs.outputFile(resource.output, content);
  }
};


gulp.task('content', async () => {
  try {
    book = await initBook();
    initTemplates();

    await renderArticleContentPartials();
    await renderPageContentPartials();

    await buildArticles();
    await buildPages();
    await buildResources();
  } catch (err) {
    console.error(err);
  }
});
