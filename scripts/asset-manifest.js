const fs = require('fs-extra');
const path = require('path');
const config = require('../config.json');


let revisionedAssetManifest = fs.readJsonSync(path.join(
    config.publicStaticDir, config.manifestFileName), {throws: false}) || {};


const getManifest = () => revisionedAssetManifest;

const saveManifest = () => {
  fs.outputJson(
      path.join(config.publicStaticDir, config.manifestFileName),
      revisionedAssetManifest, {spaces: 2});
};


const resetManifest = () => {
  revisionedAssetManifest = {};
  saveManifest();
};


const getAsset = (filename) => {
  if (!revisionedAssetManifest[filename]) {
    throw new Error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return revisionedAssetManifest[filename];
};


const addAsset = async (filename, revisionedFilename) => {
  if (revisionedAssetManifest[filename]) {
    throw new Error(`Revision for file '${filename}' already exists`);
  }

  revisionedAssetManifest[filename] = revisionedFilename;

  saveManifest();
};

module.exports = {getManifest, saveManifest, resetManifest, getAsset, addAsset};
