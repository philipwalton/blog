import fs from 'fs-extra';
import {globby} from 'globby';
import gulp from 'gulp';
import path from 'path';
import {generateRevisionedAsset} from './utils/assets.js';
import {optimizeImage} from './utils/images.js';

// const generateLowResArticleImages = (filenames) => {
//   return Promise.all(
//     filenames.map(async (filename) => {
//       const minified = await optimizeImage(filename, {width: 700}, 'webp');
//       const basename = path.basename(filename, path.extname(filename));

//       return generateRevisionedAsset(`${basename}.webp`, minified);
//     })
//   );
// };

// const generateHighResArticleImages = (filenames) => {
//   return Promise.all(
//     filenames.map(async (filename) => {
//       const minified = await optimizeImage(filename, {width: 1400}, 'webp');
//       const basename = path.basename(filename, path.extname(filename));

//       return generateRevisionedAsset(`${basename}-1400w.webp`, minified);
//     })
//   );
// };

const optimizeManifestImages = (filenames) => {
  return Promise.all(
    filenames.map(async (filename) => {
      const minified = await optimizeImage(
        filename,
        {quality: 50, colors: 128},
        'png'
      );

      return generateRevisionedAsset(path.basename(filename), minified);
    })
  );
};

const generateRevisionedAssets = (filenames) => {
  return Promise.all(
    filenames.map(async (filename) => {
      const content = await fs.readFile(filename);
      return generateRevisionedAsset(path.basename(filename), content);
    })
  );
};

gulp.task('images', async () => {
  try {
    // Article screenshots.
    // const articleFilenames = await globby('assets/images/articles/*.png');
    // await generateLowResArticleImages(articleFilenames);
    // await generateHighResArticleImages(articleFilenames);

    // Poster images
    const posterFilenames = await globby('assets/images/poster/*.png');
    await generateRevisionedAssets(posterFilenames);

    // Manifest images.
    const manifestPngFilenames = await globby('assets/images/*.png');
    await optimizeManifestImages(manifestPngFilenames);

    // GIF and SVG assets
    const svgFilenames = await globby('assets/images/**/*.+(gif|svg)');
    await generateRevisionedAssets(svgFilenames);
  } catch (err) {
    console.log(err.stack);
    console.log(err.stdout.toString());
    console.log(err.stderr.toString());
  }
});
