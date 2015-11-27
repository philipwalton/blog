import assert from 'assert';
import data from './data';


describe('Code syntax highlighting', function() {


  beforeEach(function() {
    let specificityArticle = data.articles.find((article) =>
        article.path.indexOf('do-we-actually-need-specificity-in-css') > -1);

    return browser.url(specificityArticle.path);
  })


  it('should be present on code blocks', function() {
    return browser.waitForExist('pre code.language-css .hljs-class');
  });


  it('should allow for marking specific sections', function() {
    return browser.waitForExist('pre code.language-css mark');
  });

});
