import express from 'express';
import { resolve } from 'path';
import LitExpress from '../src/index.js';

const __dirname = resolve();

const app = express();

const litExpress = LitExpress({
  viewsDir: `${__dirname}/example/public`, // where all views reside
  includesDir: `${__dirname}/example/includes`, // where all includes reside
  notFoundView: `${__dirname}/example/public/404/index.js`, // view to render when there is no index file
});

// render hello page with data
app.get('/hello', async function (req, res, next) {
  await litExpress.renderHtmlFileResponse('hello/index', res, {
    name: 'world',
  });
});

app.use(litExpress.static);

// serve all other static files like CSS, images, etc
app.use(express.static(`${__dirname}/example`));

export default app;
