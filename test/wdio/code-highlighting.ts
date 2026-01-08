import {initBook} from '../../tasks/lib/book.js';

let site;
let articles;

describe('Code syntax highlighting', () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
  });

  beforeEach(async () => {
    const specificityArticleSlug = 'do-we-actually-need-specificity-in-css';
    const specificityArticle = articles.find((article) => {
      return article.path.includes(specificityArticleSlug);
    });

    await browser.url(specificityArticle.path);

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      return title === specificityArticle.title + site.titleSuffix;
    });
  });

  it('should be present on code blocks', async () => {
    const code = await $('pre code.language-css');
    await code.waitForExist();
  });

  it('should allow for marking specific sections', async () => {
    const mark = await $('pre code.language-css mark');
    await mark.waitForExist();
  });
});
