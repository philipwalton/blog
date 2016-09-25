const assert = require('assert');
const book = require('../book');


const titleSuffix = ' \u2014 Philip Walton';


describe('The home page', () => {
  before(() => {
    browser.url('/').setViewportSize({width: 800, height: 600}, false);

    // Don't use an arrow function since this is eval'ed in test browsers.
    const {value: href} = browser.execute(function() {
      return location.protocol + '//' + location.host;
    });

    book.site.baseUrl = href;
  });

  beforeEach(() => {
    if (browser.url().value != '/') {
      browser.click('a[href="/"]');
    }
  });

  it('should have the right title', () => {
    const actualTitle = browser.getTitle();
    const expectedTitle = book.pages[0].title + titleSuffix;
    assert.equal(actualTitle, expectedTitle);
  });

  it('should contain working links to all published articles', () => {
    for (let i = 1, article; article = book.articles[i - 1]; i++) {
      const headingQuery = `.ArticleList-item:nth-last-child(${i}) h2`;
      const linkQuery = `.ArticleList-item:nth-last-child(${i}) a`;

      // Waits for the link to appear to reduce flakiness.
      browser.click('a[href="/"]').waitForVisible(linkQuery);

      const title = browser.getText(headingQuery);
      const href = browser.getAttribute(linkQuery, 'href');
      assert.equal(title, article.title);
      assert.equal(href, book.site.baseUrl + article.path);

      browser.click(linkQuery).waitUntil(urlMatches(article.path));
      assert.equal(browser.getTitle(), article.title + titleSuffix);
    }
  });

  it('should contain working links to pages', () => {
    for (let i = 1, page; page = book.pages[i-1]; i++) {
      const linkQuery = `.Header a[title="${page.title}"]`;

      // Waits for the link to appear to reduce flakiness.
      browser.click('a[href="/"]').waitForVisible(linkQuery);

      const href = browser.getAttribute(linkQuery, 'href');
      assert.equal(href, book.site.baseUrl + page.path);

      browser.click(linkQuery).waitUntil(urlMatches(page.path));
      assert.equal(browser.getTitle(), page.title + titleSuffix);
    }
  });
});


function urlMatches(expectedUrl) {
  return () => browser.url().value.includes(expectedUrl);
}
