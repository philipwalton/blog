const fs = require('fs-extra');
const path = require('path');
const revHash = require('rev-hash');
const revPath = require('rev-path');
const config = require('../../config');


let manifest;


const getInitialManifestStructure = () => {
  return {
    assetMap: {},
    modulepreload: [],
  };
};


const ensureManifest = () => {
  if (!manifest) {
    manifest = fs.readJsonSync(
        path.join(config.publicStaticDir, config.manifestFileName),
        {throws: false}) || getInitialManifestStructure();
  }
};


const getManifest = () => {
  ensureManifest();
  return manifest.assetMap;
};


const saveManifest = () => {
  fs.outputJsonSync(
      path.join(config.publicStaticDir, config.manifestFileName),
      manifest, {spaces: 2});
};


const resetManifest = () => {
  manifest = getInitialManifestStructure();
  saveManifest();
};


const getAsset = (filename) => {
  ensureManifest();

  if (!manifest.assetMap[filename]) {
    console.error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return manifest.assetMap[filename];
};


const addAsset = (filename, revisionedFilename) => {
  ensureManifest();

  manifest.assetMap[filename] = revisionedFilename;

  saveManifest();
};


const addModulePreload = (module) => {
  ensureManifest();

  if (!manifest.modulepreload.includes(module)) {
    manifest.modulepreload.push(module);
  }
  saveManifest();
};


const getModulePreloadList = () => {
  ensureManifest();

  return manifest.modulepreload;
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
  getModulePreloadList,
  addModulePreload,
};
