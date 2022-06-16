import app from './app.js';
import reload from 'reload';
import chokidar from 'chokidar';

const port = 2222;

// reload browser on file changes
reload(app, { verbose: true })
  .then(function (reloadReturned) {
    chokidar.watch(['./src', './example']).on('all', (/*event, path*/) => {
      reloadReturned.reload();
    });

    app.listen(port, function () {
      console.log(`Server started at http://localhost:${port}`);
    });
  })
  .catch(function (err) {
    console.error('Reload could not start, could not start example app', err);
  });
