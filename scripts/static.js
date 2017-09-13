const fs = require('fs-extra');
const revHash = require('rev-hash');
const revPath = require('rev-path');

const {getAsset, addAsset} = require('./asset-manifest');


const getRevisionedAssetUrl = (filename) => {
  return `/static/${getAsset(filename)}`;
};


const generateRevisionedAsset = async (filename, content) => {
  const hash = revHash(content);
  const revisionedFilename = revPath(filename, hash);

  // Updates the internal revision map so it can be referenced later.
  addAsset(filename, revisionedFilename);

  await fs.outputFile(`build/static/${revisionedFilename}`, content);
};

module.exports = {
  getRevisionedAssetUrl,
  generateRevisionedAsset,
};
