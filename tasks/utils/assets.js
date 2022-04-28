import fs from 'fs-extra';
import path from 'path';
import revHash from 'rev-hash';
import {revPath} from 'rev-path';
import {getExperiment} from './experiments.js';


const config = fs.readJSONSync('./config.json');
let manifest;

const ensureManifest = () => {
  if (!manifest) {
    manifest = fs.readJsonSync(
        path.join(config.publicDir, config.manifestFileName),
        {throws: false}) || {};
  }
};


export const getManifest = () => {
  ensureManifest();
  return manifest;
};


export const saveManifest = () => {
  fs.outputJsonSync(
      path.join(config.publicDir, config.manifestFileName),
      manifest, {spaces: 2});
};


export const resetManifest = () => {
  manifest = {};
  saveManifest();
};

const getKey = (filename, experiment) => {
  return experiment ? `_${experiment}:${filename}` : filename;
};


export const getAsset = (filename, experiment = getExperiment()) => {
  ensureManifest();

  const key = getKey(filename, experiment);

  // If an experiment is set and there's a matching key,  return that.
  // Otherwise look for the an asset matching just the filename.
  // This allows experiments to not recreate every file.
  const asset = manifest[key] || manifest[filename];

  if (!asset) {
    console.error(`Revisioned file for '${key}' doesn't exist.`);
  }

  return asset;
};


export const addAsset = (filename, revisionedFilename, experiment) => {
  ensureManifest();

  manifest[getKey(filename, experiment)] = revisionedFilename;

  saveManifest();
};


export const getRevisionedAssetUrl =
    (filename, experiment = getExperiment()) => {
  return path.join(config.publicStaticPath,
      getAsset(filename, experiment) || filename);
};


export const generateRevisionedAsset =
    (filename, content, experiment = getExperiment()) => {
  const hash = revHash(content);
  const revisionedFilename = revPath(filename, hash);

  // Updates the internal revision map so it can be referenced later.
  addAsset(filename, revisionedFilename, experiment);

  fs.outputFileSync(
      path.join(config.publicStaticDir, revisionedFilename), content);
};
