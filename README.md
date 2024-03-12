![build](https://img.shields.io/travis/markcellus/html-express-js)
![npm](https://img.shields.io/npm/v/html-express-js)
![node](https://img.shields.io/node/v/html-express-js)

# html-express-js

## Features

- Serves HTML documents using template literals
- Supports includes in served HTML documents

## Installation

```
npm install html-express-js
```

## Basic Usage

The following shows at a high level how the package can be used as an Express template engine. See [example](/example) directory for all details of a working implementation.

Set up your Express app to use this engine:

```js
import htmlExpress, { staticIndexHandler } from 'html-express-js';

const app = express();
const __dirname = resolve();

// set up engine
app.engine(
  'js',
  htmlExpress({
    includesDir: 'includes', // where all includes reside
  }),
);
// use engine
app.set('view engine', 'js');

// set directory where all index.js pages are served
app.set('views', `${__dirname}/public`);

// render HTML in public/homepage.js with data
app.get('/', function (req, res, next) {
  res.render('homepage', {
    title: 'Awesome Homepage',
    name: 'Bob',
  });
});

// OPTIONALLY: route all GET requests to directories
// to their associated static index.js views in the public directory
// and, if not found, route to the 404/index.js view
app.use(
  staticIndexHandler({
    viewsDir: `${__dirname}/public`, // root views directory to serve all index.js files
    notFoundView: '404/index', // relative to viewsDir above
  }),
);
```

Then you can create the associated files:

```js
// public/includes/head.js
import { html } from 'html-express-js';

export const view = () => html`
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0"
  />
`;
```

```js
// public/homepage.js
import { html } from 'html-express-js';

export const view = (data, state) => html`
  <!doctype html>
  <html lang="en">
    <head>
      ${state.includes.head}
      <title>${data.title}</title>
    </head>

    <body>
      <h1>This is the homepage for ${data.name}</h1>
    </body>
  </html>
`;
```
