const fs = require('fs');
const yaml = require('js-yaml');


const excludeDraftsInProduction = (item) => {
  return process.env.NODE_ENV == 'production' ? !item.draft : true;
}

const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
book.articles = book.articles.filter(excludeDraftsInProduction);
book.page = book.pages.filter(excludeDraftsInProduction);


module.exports = book;
