import express from 'express';
import { resolve } from 'path';
import litExpress from '../src/index.js';

const __dirname = resolve();

const app = express();

app.engine(
  'js',
  litExpress({
    includesDir: 'includes',
    notFoundView: '404/index',
  })
);

app.set('view engine', 'js');
app.set('views', `${__dirname}/example/public`);

app.get('/', async function (req, res) {
  res.render('dashboard');
});

app.get('/hello', async function (req, res) {
  res.render('hello', {
    name: 'world',
  });
});

// serve all other static files like CSS, images, etc
app.use(express.static(`${__dirname}/example/public`));

export default app;
