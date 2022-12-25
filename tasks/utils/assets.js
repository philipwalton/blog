import fs from 'fs-extra';
import path from 'path';
import revHash from 'rev-hash';
import {revPath} from 'rev-path';

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
    {spaces: 2}
  );
};

export const resetManifest = () => {
  manifest = {};
  saveManifest();
};

export const getAsset = (filename) => {
  ensureManifest();

  if (!manifest[filename]) {
    console.error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return manifest[filename];
};

export const addAsset = (filename, revisionedFilename) => {
  ensureManifest();

  manifest[filename] = revisionedFilename;

  saveManifest();
};

export const getRevisionedAssetUrl = (filename) => {
  return path.join(config.publicStaticPath, getAsset(filename) || filename);
};

export const generateRevisionedAsset = (filename, content, extra) => {
  const hash = revHash(content + extra);
  const revisionedFilename = revPath(filename, hash);

  // Updates the internal revision map so it can be referenced later.
  addAsset(filename, revisionedFilename);

  fs.outputFileSync(
    path.join(config.publicStaticDir, revisionedFilename),
    content
  );
};
