const book = require('../book');


describe('Code syntax highlighting', () => {
  beforeEach(() => {
    const specificityArticleSlug = 'do-we-actually-need-specificity-in-css';
    const specificityArticle = book.articles.find((article) => {
      return article.path.includes(specificityArticleSlug);
    });

    browser.url(specificityArticle.path);
  });

  it('should be present on code blocks', () => {
    browser.waitForExist('pre code.language-css');
  });

  it('should allow for marking specific sections', () => {
    browser.waitForExist('pre code.language-css mark');
  });
});
