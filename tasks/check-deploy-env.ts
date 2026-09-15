import fs from 'node:fs';
import path from 'node:path';

// `wrangler deploy` reads this redirect file to find the generated config.
const REDIRECT_PATH = '.wrangler/deploy/config.json';

function readJSON(file: string) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function fail(message: string): never {
  console.error(`Refusing to deploy: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(REDIRECT_PATH)) {
  fail(`${REDIRECT_PATH} not found. Run \`npm run build\` first.`);
}

const {configPath} = readJSON(REDIRECT_PATH);
const config = readJSON(path.resolve(path.dirname(REDIRECT_PATH), configPath));
const environment = config.vars?.ENVIRONMENT;

if (environment !== 'production') {
  fail(
    `the built Worker config sets ENVIRONMENT to "${environment}". ` +
      'Rebuild with `npm run build` before deploying.',
  );
}
