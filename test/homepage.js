import assert from 'assert';
import data from './data';


describe('The home page', function() {


  function getUrlPath() {
    return browser.execute(() => location.pathname)
        .then(({value:urlPath}) => urlPath);
  }

  before(function() {
    return browser.url('/')
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

      let title = yield browser.url('/').getText(headingQuery);
      let href = yield browser.getAttribute(linkQuery, 'href');
      assert.equal(title, article.title);
      assert.equal(href, data.baseUrl + article.path);

      title = yield browser.click(linkQuery).getTitle();
      let path = yield getUrlPath();
      assert.equal(title, article.title + data.titleSuffix);
      assert.equal(path, article.path);
    }
  });


  it('should contain working links to pages', function *() {

    for (let i = 1, page; page = data.pages[i-1]; i++) {

      let linkQuery = `.MainNav a:nth-child(${i})`;

      let title = yield browser.url('/').getText(linkQuery);
      let href = yield browser.getAttribute(linkQuery, 'href');
      assert.equal(title, page.title);
      assert.equal(href, data.baseUrl + page.path);

      title = yield browser.click(linkQuery).getTitle();
      let path = yield getUrlPath();
      assert.equal(title, page.title + data.titleSuffix);
      assert.equal(path, page.path);
    }
  });


});
