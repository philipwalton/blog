import assert from 'assert';
import data from './data';


describe('The home page', function() {


  function getUrlPath() {
    return browser.execute(() => location.pathname)
        .then(({value:urlPath}) => urlPath);
  }

  before(function() {
    return browser.url('/')
        .setViewportSize({width:800, height:600}, false)
        .execute(() => location.protocol + '//' + location.host)
        .then(({value:href}) => data.baseUrl = href);
  });


  it('should have the right title', function *() {
    let actualTitle = yield browser.url('/').getTitle();
    let expectedTitle = data.pages[0].title + data.titleSuffix;
    assert.equal(actualTitle, expectedTitle);
  });


  it('should contain working links to all published articles', function *() {

    for (let i = 1, article; article = data.articles[i - 1]; i++) {

      let headingQuery = `.ArticleList-item:nth-last-child(${i}) h2`;
      let linkQuery = `.ArticleList-item:nth-last-child(${i}) a`;

      // Waits for the link to appear to reduce flakiness.
      yield browser.url('/').waitForVisible(linkQuery);

      let title = yield browser.getText(headingQuery);
      let href = yield browser.getAttribute(linkQuery, 'href');

      assert.equal(title, article.title);
      assert.equal(href, data.baseUrl + article.path);

      title = yield browser
          .click(linkQuery)
          .waitUntil(urlMatches(article.path))
          .getTitle();

      assert.equal(title, article.title + data.titleSuffix);
    }
  });


  it('should contain working links to pages', function *() {

    for (let i = 1, page; page = data.pages[i-1]; i++) {

      let linkQuery = `.Header a[title="${page.title}"]`;

      // Waits for the link to appear to reduce flakiness.
      yield browser.url('/').waitForVisible(linkQuery);

      let href = yield browser.getAttribute(linkQuery, 'href');
      assert.equal(href, data.baseUrl + page.path);

      let title = yield browser
          .click(linkQuery)
          .waitUntil(urlMatches(page.path))
          .getTitle();

      assert.equal(title, page.title + data.titleSuffix);
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
