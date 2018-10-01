const assert = require('assert');
const {initBook} = require('../tasks/utils/book');


let site;
let articles;
let pages;

describe('The home page', () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
    pages = book.pages;
  });

  before(async () => {
    browser.url('/').setViewportSize({width: 800, height: 600}, false);

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    browser.waitUntil(() => {
      return browser.getTitle() == pages[0].title + site.titleSuffix;
    });
  });

  beforeEach(() => {
    if (browser.url().value != '/') {
      browser.click('a[href="/"]');
    }
  });

  it('should have the right title', () => {
    const actualTitle = browser.getTitle();
    const expectedTitle = pages[0].title + site.titleSuffix;
    assert.equal(actualTitle, expectedTitle);
  });

  it('should contain working links to all published articles', () => {
    for (let i = 1, article; article = articles[i - 1]; i++) {
      const headingQuery = `.ArticleList-item:nth-last-child(${i}) h2`;
      const linkQuery = `.ArticleList-item:nth-last-child(${i}) a`;

      // Waits for the link to appear to reduce flakiness.
      browser.click('a[href="/"]').waitForVisible(linkQuery);

      const title = browser.getText(headingQuery);
      const href = browser.getAttribute(linkQuery, 'href');
      assert.equal(title, article.title);
      assert.equal(new URL(href, site.baseUrl).pathname, article.path);

      browser.click(linkQuery).waitUntil(urlMatches(article.path));
      assert.equal(browser.getTitle(), article.title + site.titleSuffix);
    }
  });

  it('should contain working links to pages', () => {
    const contentPages = pages.filter((page) => {
      return !(
          page.path == '/404.html' ||
          page.path == '/atom.xml' ||
          page.path == '/manifest.json');
    });

    for (let i = 1, page; page = contentPages[i-1]; i++) {
      const linkQuery = `.Header a[title="${page.title}"]`;

      // Waits for the link to appear to reduce flakiness.
      browser.click('a[href="/"]').waitForVisible(linkQuery);

      const href = browser.getAttribute(linkQuery, 'href');
      assert.equal(new URL(href, site.baseUrl).pathname, page.path);

      browser.click(linkQuery).waitUntil(urlMatches(page.path));
      assert.equal(browser.getTitle(), page.title + site.titleSuffix);
    }
  });
});


/**
 * Returns whether the passed URL matches the URL for the current page.
 * @param {string} expectedUrl The URL to test against.
 * @return {boolean} True if the passed URL matches.
 */
function urlMatches(expectedUrl) {
  return () => browser.url().value.includes(expectedUrl);
}
