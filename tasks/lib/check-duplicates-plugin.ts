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
export const checkModuleDuplicates = (modulePaths) => {
  const NODE_MODULES = 'node_modules';
  const moduleIds = {};
  for (const modulePath of modulePaths) {
    if (modulePath.includes(NODE_MODULES)) {
      const id = modulePath.slice(
        modulePath.lastIndexOf(NODE_MODULES) + NODE_MODULES.length + 1,
      );

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

/**
 * A Rollup plugin that will fail the build it two chunks are detected with
 * the same name. This is to avoid the issue described here (and need to be
 * used until it's resolved):
 * https://github.com/rollup/rollup/issues/3060#issuecomment-522719783
 * @return {Object}
 */
export const checkDuplicatesPlugin = () => {
  const NODE_MODULES = 'node_modules';
  const nodeModuleIds = new Map();

  return {
    name: 'check-duplicates',
    load(id) {
      if (id.includes(NODE_MODULES)) {
        const nodeModuleId = id.slice(
          id.lastIndexOf(NODE_MODULES) + NODE_MODULES.length + 1,
        );

        if (nodeModuleIds.has(nodeModuleId)) {
          throw new Error(
            `Duplicate node module detected:` +
              `\n\t- '${nodeModuleIds.get(nodeModuleId)}'` +
              `\n\t- '${id}'`,
          );
        }

        nodeModuleIds.set(nodeModuleId, id);
      }
    },
    generateBundle(options, bundle) {
      const chunkNames = new Set();
      for (const chunkInfo of Object.values(bundle)) {
        const name = chunkInfo.name;

        if (chunkNames.has(name)) {
          throw new Error(`Duplicate chunk name detected: '${name}'`);
        }
        chunkNames.add(name);
      }
    },
  };
};
