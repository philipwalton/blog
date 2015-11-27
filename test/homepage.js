import assert from 'assert';
import data from './data';

describe('The home page', function() {

  it('should have the right title', function *() {
    let title = yield browser.url('/').getTitle();
    assert.equal(title, 'Home' + data.titleSuffix);
  });

  it('should contain working links to all published articles', function *() {
    for (let i = 1, expectedTitle; expectedTitle = data.articles[i-1]; i++) {
      let selector = `.ArticleList-item:nth-child(${i}) .ArticlePreview-title`;
      let actualTitle = yield browser.url('/').getText(selector);
      assert.equal(actualTitle, expectedTitle);

      let pageTitle = yield browser.click(selector).getTitle();
      assert.equal(pageTitle, expectedTitle + data.titleSuffix);
    }
  });

});
