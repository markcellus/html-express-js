import express from 'express';
import { resolve } from 'path';
import htmlExpress, { renderView } from '../src/index.js';

const __dirname = resolve();

const app = express();
const viewsDir = `${__dirname}/example/public`;

const { engine, staticIndexHandler } = htmlExpress({
  viewsDir,
  includesDir: `${viewsDir}/includes`,
  notFoundView: 'not-found', // OPTIONAL: defaults to `404/index`
});

app.engine('js', engine);

app.set('view engine', 'js');
app.set('views', viewsDir);

// serve all other static files like CSS, images, etc
app.use(express.static(viewsDir));

app.get('/hello', async function (req, res) {
  renderView('hello/index', req, res, {
    name: 'world',
  });
});

// Automatically serve any index.js file as HTML in the example/public directory
app.use(staticIndexHandler());

export default app;
