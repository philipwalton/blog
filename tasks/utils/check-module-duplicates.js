/**
 * Takes an array of module file paths and checks for duplicates that point
 * to the same node module.
 *
 * Ideally this would be handled by the bundler, but currently it's not, nor
 * is it handled by any existing plugins:
 * https://github.com/rollup/rollup-plugin-node-resolve/issues/149
 * https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin/issues/19
 *
 * @param {Array<string>} modulePaths
 */
const checkModuleDuplicates = (modulePaths) => {
  const NODE_MODULES = 'node_modules';
  const moduleIds = {};
  for (const modulePath of modulePaths) {
    if (modulePath.includes(NODE_MODULES)) {
      const id = modulePath.slice(
          modulePath.lastIndexOf(NODE_MODULES) + NODE_MODULES.length + 1);

      if (!moduleIds[id]) moduleIds[id] = [];

      moduleIds[id].push(modulePath);
    }
  }

  for (const [id, instances] of Object.entries(moduleIds)) {
    if (instances.length > 1) {
      console.log(`Duplicate module detected for: ${id}`);
      console.log(instances);
      process.exit(1);
    }
  }
};

module.exports = {checkModuleDuplicates};
