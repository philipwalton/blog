import assert from 'assert';
import data from './data';


describe('The content loader', function() {

  function getUrlPath() {
    return browser.execute(() => location.pathname)
        .then(({value:urlPath}) => urlPath);
  }


  beforeEach(function() {
    return browser.url('/')
        .execute(() => window.__INITIAL_PAGE_LOAD__ = true);
  });


  afterEach(function() {
    return browser.execute(() => window.__INITIAL_PAGE_LOAD__)
        .then(({value:isInitialPageLoad}) => assert(isInitialPageLoad));
  });


  it('should load page partials instead of full pages', function *() {
    let articleTitle = yield browser
        .click(`a[href="${data.articles[0].path}"]`).getTitle();
    let articlePath = yield getUrlPath();
    assert.equal(articleTitle, data.articles[0].title + data.titleSuffix);
    assert.equal(articlePath, data.articles[0].path);
  });


  it('should work with the back and forward buttons', function *() {
    // Navigates to an article.
    let currentTitle = yield browser
        .click(`a[href="${data.articles[0].path}"]`).getTitle();
    let currentPath = yield getUrlPath();

    // Navigates to a page.
    currentTitle = yield browser
        .click(`a[href="${data.pages[2].path}"]`).getTitle();
    currentPath = yield getUrlPath();
    assert.equal(currentTitle, data.pages[2].title + data.titleSuffix);
    assert.equal(currentPath, data.pages[2].path);

    // Navigates back to the article.
    currentTitle = yield browser.back().getTitle();
    currentPath = yield getUrlPath();
    assert.equal(currentTitle, data.articles[0].title + data.titleSuffix);
    assert.equal(currentPath, data.articles[0].path);

    // Navigates back home.
    currentTitle = yield browser.back().getTitle();
    currentPath = yield getUrlPath();
    assert.equal(currentTitle, data.pages[0].title + data.titleSuffix);
    assert.equal(currentPath, data.pages[0].path);

    // Navigates forward to the article.
    currentTitle = yield browser.forward().getTitle();
    currentPath = yield getUrlPath();
    assert.equal(currentTitle, data.articles[0].title + data.titleSuffix);
    assert.equal(currentPath, data.articles[0].path);

    // Navigates forward to the page.
    currentTitle = yield browser.forward().getTitle();
    currentPath = yield getUrlPath();
    assert.equal(currentTitle, data.pages[2].title + data.titleSuffix);
    assert.equal(currentPath, data.pages[2].path);
  });


  it('should scroll to the top for "new" pages', function *() {
    browser.click('.ArticleList-item:last-child a')
        .waitForVisible('.ContentHeader-title');
  });


  it('should jump to an anchor for URLs with hash fragments', function *() {
    // Adds a hash fragments to an article URL
    return browser.execute(function() {
      document.querySelector('.ArticleList-item:last-child a').href += '#share';
    }).click('.ArticleList-item:last-child a').waitForVisible('#share');
  });

});
