const fs = require('fs-extra');
const path = require('path');
const revHash = require('rev-hash');
const revPath = require('rev-path');
const config = require('../../config');


let manifest;


const ensureManifest = () => {
  if (!manifest) {
    manifest = fs.readJsonSync(
        path.join(config.publicDir, config.manifestFileName),
        {throws: false}) || {};
  }
};


const getManifest = () => {
  ensureManifest();
  return manifest;
};


const saveManifest = () => {
  fs.outputJsonSync(
      path.join(config.publicDir, config.manifestFileName),
      manifest, {spaces: 2});
};


const resetManifest = () => {
  manifest = {};
  saveManifest();
};


const getAsset = (filename) => {
  ensureManifest();

  if (!manifest[filename]) {
    console.error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return manifest[filename];
};


const addAsset = (filename, revisionedFilename) => {
  ensureManifest();

  manifest[filename] = revisionedFilename;

  saveManifest();
};


const getRevisionedAssetUrl = (filename) => {
  return path.join(config.publicStaticPath, getAsset(filename) || filename);
};


const generateRevisionedAsset = (filename, content) => {
  const hash = revHash(content);
  const revisionedFilename = revPath(filename, hash);

  // Updates the internal revision map so it can be referenced later.
  addAsset(filename, revisionedFilename);

  fs.outputFileSync(
      path.join(config.publicStaticDir, revisionedFilename), content);
};

module.exports = {
  getManifest,
  saveManifest,
  resetManifest,
  getAsset,
  addAsset,
  getRevisionedAssetUrl,
  generateRevisionedAsset,
};
