const fs = require('fs');
const yaml = require('js-yaml');
const {getManifest} = require('./tasks/utils/assets');


const excludeDraftsInProduction = (item) => {
  return process.env.NODE_ENV == 'production' ? !item.draft : true;
}

const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const assetManifest = getManifest();

book.articles = book.articles.filter(excludeDraftsInProduction);
book.page = book.pages.filter(excludeDraftsInProduction);
book.buildTime = new Date;
book.site.assets = {
  modules: Object.keys(assetManifest).filter((entry) => entry.match(/\.mjs$/)),
};

module.exports = book;
