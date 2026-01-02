import fs from 'fs-extra';
import path from 'path';
import revHash from 'rev-hash';
import {revPath} from 'rev-path';
import {memoize} from './memoize.js';

const getHash = memoize(revHash);
const revisionFile = memoize(revPath);

const config = fs.readJSONSync('./config.json');
let manifest;

const ensureManifest = () => {
  if (!manifest) {
    manifest =
      fs.readJsonSync(path.join(config.publicDir, config.manifestFileName), {
        throws: false,
      }) || {};
  }
};

export const getManifest = () => {
  ensureManifest();
  return manifest;
};

export const saveManifest = () => {
  fs.outputJsonSync(
    path.join(config.publicDir, config.manifestFileName),
    manifest,
    {spaces: 2},
  );
};

export const resetManifest = () => {
  manifest = {};
  saveManifest();
};

export const getAsset = (filename) => {
  ensureManifest();

  const basename = path.basename(filename);

  if (!manifest[basename]) {
    console.error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return manifest[basename];
};

export const addAsset = (filename, revisionedFilename, content) => {
  ensureManifest();

  // Revisioned assets always have unique filenames, so they
  // can safely be added to the same public directory.
  const basename = path.basename(filename);

  manifest[basename] = revisionedFilename;

  fs.outputFileSync(
    path.join(config.publicStaticDir, revisionedFilename),
    content,
  );

  saveManifest();
};

export const getRevisionedAssetUrl = (filename) => {
  return path.join(config.publicStaticPath, getAsset(filename) || filename);
};

export const generateRevisionedAsset = (filename, content) => {
  if (!content) {
    content = fs.readFileSync(filename);
  }

  const basename = path.basename(filename);
  const hash = getHash(content);
  const revisionedFilename = revisionFile(basename, hash);

  // Updates the internal revision map so it can be referenced later.
  addAsset(basename, revisionedFilename, content);

  return getRevisionedAssetUrl(basename);
};
