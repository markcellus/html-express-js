import express from 'express';
import { resolve } from 'path';
import htmlExpress, { staticIndexHandler } from '../src/index.js';

const __dirname = resolve();

const app = express();

app.engine(
  'js',
  htmlExpress({
    includesDir: 'includes',
  }),
);

app.set('view engine', 'js');
app.set('views', `${__dirname}/example/public`);

// serve all other static files like CSS, images, etc
app.use(express.static(`${__dirname}/example/public`));

app.get('/hello', async function (req, res) {
  res.render('hello', {
    name: 'world',
  });
});

// Automatically serve any index.js file as HTML in the public directory
app.use(
  staticIndexHandler({
    viewsDir: `${__dirname}/example/public`,
    notFoundView: 'not-found', // OPTIONAL: defaults to `404/index`
  }),
);

export default app;
