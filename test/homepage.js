import assert from 'assert';


const TITLE_SUFFIX = ' \u2014 Philip Walton';


const ARTICLES = [
  'Do We Actually Need Specificity In CSS?',
  'How to Become a Great Front-End Engineer',
  'Extending Styles',
  'Side Effects in CSS',
  'Normalizing Cross-browser Flexbox Bugs',
  'Measuring Your Site\'s Responsive Breakpoint Usage',
  'The Dangers of Stopping Event Propagation',
  'Stop Copying Social Code Snippets',
  'Implementing Private and Protected Members in JavaScript',
  'How to Find Qualified Developers',
  'Interviewing as a Front-End Engineer in San Francisco',
  'Solved by Flexbox',
  'Decoupling Your HTML, CSS, and JavaScript',
  'Why I Test Private Functions In JavaScript',
  'How to Unit Test Private Functions in JavaScript',
  'Introducing HTML Inspector',
  'CSS: Everything is Global and How to Deal With It',
  'Dynamic Selectors',
  'Defending Presentational Class Names',
  'The Future of OOCSS: A Proposal',
  'What No One Told You About Z-Index',
  'CSS Architecture',
];

describe('The home page', function() {

  it('should have the right title', function *() {
    let title = yield browser.url('/').getTitle();
    assert(title, 'Home' + TITLE_SUFFIX);
  });

  it('should contain links to all published articles', function *() {
    let titleEls = yield browser.url('/')
        .elements('.ArticlePreview-title');

    for (let i = 0, el; el = titleEls.value[i]; i++) {
      let actualTitle = (yield browser.elementIdText(el.ELEMENT)).value;
      let expectedTitle = ARTICLES[i];
      assert(actualTitle, expectedTitle);
    }
  });


});
