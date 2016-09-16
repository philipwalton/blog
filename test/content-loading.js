const assert = require('assert');
const fs = require('fs');
const yaml = require('js-yaml');


const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const titleSuffix = ' \u2014 Philip Walton';


describe('The content loader', () => {

  function getUrlPath() {
    // Don't use an arrow function since this is eval'ed in test browsers.
    let {value: urlPath} = browser.execute(function() {
      return location.pathname;
    });
    return urlPath;
  }


  beforeEach(() => {
    // Don't use an arrow function since this is eval'ed in test browsers.
    browser.url('/').execute(function() {
      return window.__INITIAL_PAGE_LOAD__ = true;
    });
  });


  afterEach(() => {
    // Don't use an arrow function since this is eval'ed in test browsers.
    let {value: isInitialPageLoad} = browser.execute(function() {
      return window.__INITIAL_PAGE_LOAD__;
    });

    assert(isInitialPageLoad);
  });


  it('should load page partials instead of full pages', () => {
    browser.click(`a[href="${book.articles[0].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == book.articles[0].title + titleSuffix &&
        getUrlPath() == book.articles[0].path);
  });


  it('should work with the back and forward buttons', () => {

    // Ensures the viewport is big enough so all navigation is present.
    browser.setViewportSize({width: 1024, height: 768}, true);

    // Navigates to an article.
    browser.click(`a[href="${book.articles[0].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == book.articles[0].title + titleSuffix &&
        getUrlPath() == book.articles[0].path);


    // Navigates to a page.
    browser.click(`a[href="${book.pages[2].path}"]`);
    browser.waitUntil(() =>
        browser.getTitle() == book.pages[2].title + titleSuffix &&
        getUrlPath() == book.pages[2].path);


    // Navigates back to the article.
    browser.back();
    browser.getTitle();
    browser.waitUntil(() =>
        browser.getTitle() == book.articles[0].title + titleSuffix &&
        getUrlPath() == book.articles[0].path);

    // Navigates back home.
    browser.back();
    browser.getTitle();
    browser.waitUntil(() =>
        browser.getTitle() == book.pages[0].title + titleSuffix &&
        getUrlPath() == book.pages[0].path);

    // Navigates forward to the article.
    browser.forward();
    browser.getTitle();
    browser.waitUntil(() =>
        browser.getTitle() == book.articles[0].title + titleSuffix &&
        getUrlPath() == book.articles[0].path);

    // Navigates forward to the page.
    browser.forward();
    browser.getTitle();
    browser.waitUntil(() =>
        browser.getTitle() == book.pages[2].title + titleSuffix &&
        getUrlPath() == book.pages[2].path);

  });


  it('should scroll to the top for "new" pages', () => {
    browser
        .click('.ArticleList-item:last-child a')
        .waitForVisible('.ContentHeader-articleTitle');
  });


  it('should jump to an anchor for URLs with hash fragments', () => {
    // Adds a hash fragments to an article URL.
    // Don't use an arrow function since this is eval'ed in test browsers.
    browser.execute(function() {
      document.querySelector('.ArticleList-item:last-child a').href += '#share';
    }).click('.ArticleList-item:last-child a').waitForVisible('#share');
  });

});
