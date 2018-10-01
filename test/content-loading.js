const assert = require('assert');
const {initBook} = require('../tasks/utils/book');


let site;
let articles;
let pages;


describe('The content loader', async () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(() => {
    browser.url('/');

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    browser.waitUntil(() => {
      return browser.getTitle() == pages[0].title + site.titleSuffix;
    });

    // Don't use an arrow function since this is eval'ed in test browsers.
    browser.execute(function() {
      return window.__INITIAL_PAGE_LOAD__ = true;
    });
  });

  it('should load page partials instead of full pages', () => {
    browser.click(`a[href="${articles[0].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == articles[0].title + site.titleSuffix &&
        getUrlPath() == articles[0].path);

    assertIsInitialPageLoad();
  });

  it('should not attempt to load non-HTML content', () => {
    browser.click(`a[href="${articles[28].path}"]`);

    browser.waitUntil(() =>
        browser.getTitle() == articles[28].title + site.titleSuffix &&
        getUrlPath() == articles[28].path);

    browser.click('figure img');
    browser.waitUntil(() => /\.png$/.test(getUrlPath()));
  });


  it('should work with the back and forward buttons', () => {
    // Ensures the viewport is big enough so all navigation is present.
    browser.setViewportSize({width: 1024, height: 768}, true);

    // Navigates to an article.
    browser.click(`a[href="${articles[0].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == articles[0].title + site.titleSuffix &&
        getUrlPath() == articles[0].path);

    // Navigates to a page.
    browser.click(`a[href="${pages[2].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == pages[2].title + site.titleSuffix &&
        getUrlPath() == pages[2].path);

    // Navigates back to the article.
    browser.back();
    browser.waitUntil(() =>
        browser.getTitle() == articles[0].title + site.titleSuffix &&
        getUrlPath() == articles[0].path);


    // Navigates back home.
    browser.back();
    browser.waitUntil(() =>
        browser.getTitle() == pages[0].title + site.titleSuffix &&
        getUrlPath() == pages[0].path);

    // Navigates forward to the article.
    browser.forward();
    browser.waitUntil(() =>
        browser.getTitle() == articles[0].title + site.titleSuffix &&
        getUrlPath() == articles[0].path);

    // Navigates forward to the page.
    browser.forward();
    browser.waitUntil(() =>
        browser.getTitle() == pages[2].title + site.titleSuffix &&
        getUrlPath() == pages[2].path);

    assertIsInitialPageLoad();
  });

  it('should scroll to the top for "new" pages', () => {
    browser
        .click('.ArticleList-item:last-child a')
        .waitForVisible('.ContentHeader-articleTitle');

    assertIsInitialPageLoad();
  });

  it('should jump to an anchor for URLs with hash fragments', () => {
    // Adds a hash fragments to an article URL.
    // Don't use an arrow function since this is eval'ed in test browsers.
    browser.execute(function() {
      document.querySelector('.ArticleList-item:last-child a').href += '#share';
    }).click('.ArticleList-item:last-child a').waitForVisible('#share');

    assertIsInitialPageLoad();
  });
});


/**
 * Asserts that the browser hasn't reloaded the page since the test started.
 */
function assertIsInitialPageLoad() {
  // Don't use an arrow function since this is eval'ed in test browsers.
  const {value: isInitialPageLoad} = browser.execute(function() {
    return window.__INITIAL_PAGE_LOAD__;
  });

  assert(isInitialPageLoad);
}


/**
 * Gets the URL path for the given page.
 * @return {string} The URL path.
 */
function getUrlPath() {
  // Don't use an arrow function since this is eval'ed in test browsers.
  const {value: urlPath} = browser.execute(function() {
    return location.pathname;
  });
  return urlPath;
}
