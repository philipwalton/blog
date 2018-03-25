const {initBook} = require('../tasks/utils/book');


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

    browser.url(specificityArticle.path);

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    browser.waitUntil(() => {
      return browser.getTitle() == specificityArticle.title + site.titleSuffix;
    });
  });

  it('should be present on code blocks', () => {
    browser.waitForExist('pre code.language-css');
  });

  it('should allow for marking specific sections', () => {
    browser.waitForExist('pre code.language-css mark');
  });
});
