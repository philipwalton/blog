const fs = require('fs-extra');
const revHash = require('rev-hash');
const revPath = require('rev-path');


const revisionMap = new Map();


const getRevisionedAssetUrl = (filename) => {
  if (!revisionMap.has(filename)) {
    throw new Error(`Revisioned file for '${filename}' doesn't exist`);
  }

  return `/static/${revPath(filename, revisionMap.get(filename))}`;
};


const generateRevisionedAsset = async (filename, content, opts = {}) => {
  const hash = revHash(content);
  const revisionedPath = revPath(filename, hash);

  // Updates the internal revision map so it can be referenced later.
  revisionMap.set(filename, hash);

  if (opts.sourceMap) {
    const revisionedMapPath = `${revisionedPath}.map`;
    await fs.outputFile(`build/static/${revisionedMapPath}`, opts.sourceMap);

    content += `\n//# sourceMappingURL=${revisionedMapPath}`;
  }

  await fs.outputFile(`build/static/${revisionedPath}`, content);
};

module.exports = {
  getRevisionedAssetUrl,
  generateRevisionedAsset,
};
