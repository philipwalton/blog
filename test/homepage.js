const assert = require('assert');
const fs = require('fs');
const yaml = require('js-yaml');


const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const titleSuffix = ' \u2014 Philip Walton';


describe('The home page', () => {

  before(() => {
    browser.url('/').setViewportSize({width: 800, height: 600}, false);
    let {value: href} = browser
        .execute(() => location.protocol + '//' + location.host);

    book.site.baseUrl = href;
  });


  it('should have the right title', () => {
    let actualTitle = browser.url('/').getTitle();
    let expectedTitle = book.pages[0].title + titleSuffix;
    assert.equal(actualTitle, expectedTitle);
  });


  it('should contain working links to all published articles', () => {

    for (let i = 1, article; article = book.articles[i - 1]; i++) {

      let headingQuery = `.ArticleList-item:nth-last-child(${i}) h2`;
      let linkQuery = `.ArticleList-item:nth-last-child(${i}) a`;

      // Waits for the link to appear to reduce flakiness.
      browser.url('/').waitForVisible(linkQuery);

      let title = browser.getText(headingQuery);
      let href = browser.getAttribute(linkQuery, 'href');
      assert.equal(title, article.title);
      assert.equal(href, book.site.baseUrl + article.path);

      browser.click(linkQuery).waitUntil(urlMatches(article.path));
      assert.equal(browser.getTitle(), article.title + titleSuffix);
    }
  });


  it('should contain working links to pages', () => {

    for (let i = 1, page; page = book.pages[i-1]; i++) {

      let linkQuery = `.Header a[title="${page.title}"]`;

      // Waits for the link to appear to reduce flakiness.
      browser.url('/').waitForVisible(linkQuery);

      let href = browser.getAttribute(linkQuery, 'href');
      assert.equal(href, book.site.baseUrl + page.path);

      browser.click(linkQuery).waitUntil(urlMatches(page.path));
      assert.equal(browser.getTitle(), page.title + titleSuffix);
    }
  });

});


function urlMatches(expectedUrl) {
  return () => browser.url().value.includes(expectedUrl);
}
