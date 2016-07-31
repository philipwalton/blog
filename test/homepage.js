import assert from 'assert';
import fs from 'fs';
import yaml from 'js-yaml';


const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const titleSuffix = ' \u2014 Philip Walton';


describe('The home page', function() {


  function getUrlPath() {
    return browser.execute(() => location.pathname)
        .then(({value:urlPath}) => urlPath);
  }

  before(function() {
    return browser.url('/')
        .setViewportSize({width:800, height:600}, false)
        .execute(() => location.protocol + '//' + location.host)
        .then(({value:href}) => book.site.baseUrl = href);
  });


  it('should have the right title', function *() {
    let actualTitle = yield browser.url('/').getTitle();
    let expectedTitle = book.pages[0].title + titleSuffix;
    assert.equal(actualTitle, expectedTitle);
  });


  it('should contain working links to all published articles', function *() {

    for (let i = 1, article; article = book.articles[i - 1]; i++) {

      let headingQuery = `.ArticleList-item:nth-last-child(${i}) h2`;
      let linkQuery = `.ArticleList-item:nth-last-child(${i}) a`;

      // Waits for the link to appear to reduce flakiness.
      yield browser.url('/').waitForVisible(linkQuery);

      let title = yield browser.getText(headingQuery);
      let href = yield browser.getAttribute(linkQuery, 'href');

      assert.equal(title, article.title);
      assert.equal(href, book.site.baseUrl + article.path);

      title = yield browser
          .click(linkQuery)
          .waitUntil(urlMatches(article.path))
          .getTitle();

      assert.equal(title, article.title + titleSuffix);
    }
  });


  it('should contain working links to pages', function *() {

    for (let i = 1, page; page = book.pages[i-1]; i++) {

      let linkQuery = `.Header a[title="${page.title}"]`;

      // Waits for the link to appear to reduce flakiness.
      yield browser.url('/').waitForVisible(linkQuery);

      let href = yield browser.getAttribute(linkQuery, 'href');
      assert.equal(href, book.site.baseUrl + page.path);

      let title = yield browser
          .click(linkQuery)
          .waitUntil(urlMatches(page.path))
          .getTitle();

      assert.equal(title, page.title + titleSuffix);
    }
  });

});


function urlMatches(expectedUrl) {
  return function() {
    return browser.url().then(function(result) {
      var actualUrl = result.value;
      return actualUrl.indexOf(expectedUrl) > -1;
    });
  }
}
