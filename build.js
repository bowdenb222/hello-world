/* Inlines the app into one self-contained HTML file (dist/app.html) so it can be
   opened from a single link or saved offline without the service worker. */
const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8');

let html = rd('index.html');
html = html
  .replace('<link rel="stylesheet" href="css/app.css">', `<style>\n${rd('css/app.css')}\n</style>`)
  .replace('<script src="js/crops.js"></script>', `<script>\n${rd('js/crops.js')}\n</script>`)
  .replace('<script src="js/app.js"></script>', `<script>\n${rd('js/app.js')}\n</script>`)
  // no service worker, manifest or external icon in the single-file build
  .replace(/^.*rel="manifest".*\n/m, '')
  .replace(/^.*apple-touch-icon.*\n/m, '')
  .replace(/^.*rel="icon".*\n/m, '')
  .replace(/if \('serviceWorker' in navigator\)\{[\s\S]*?\}\n/, '');

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/app.html', html);
console.log(`dist/app.html — ${(html.length/1024).toFixed(0)} KB, self-contained`);
