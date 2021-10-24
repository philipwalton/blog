import fs from 'fs-extra';

const config = fs.readJSONSync('./config.json');

/** @type {string|null} */
let experiment = null;

/**
 * @returns {string|null}
 */
export function getExperiment() {
  return experiment;
}

/**
 * @param {(experiment: string) => Promise<void>} callback
 */
export async function eachExperiment(callback) {
  for (const exp of [null, ...config.experiments]) {
    experiment = exp;
    await callback(exp);
  }
  experiment = null;
}
