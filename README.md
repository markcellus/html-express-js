![build](https://img.shields.io/travis/markcellus/html-express-js)
![npm](https://img.shields.io/npm/v/html-express-js)
![node](https://img.shields.io/node/v/html-express-js)

# html-express-js

## Features

- Serves HTML documents using template literals
- Supports includes in HTML documents
- Allows shared global state throughout templates

## Installation

```
npm install html-express-js
```

## Basic Usage

The following is a high level example of how the package can be used as an Express template engine. See [example](/example) directory for all details of a working implementation.

Set up your Express app to use this engine:

```js
import htmlExpress, { renderView } from 'html-express-js';

const app = express();
const __dirname = resolve();

const viewsDir = `${__dirname}/public`;

const { engine, staticIndexHandler } = htmlExpress({
  viewsDir, // root views directory to serve all index.js files
  includesDir: `${viewsDir}/includes`, // OPTIONAL: where all includes reside
  notFoundView: '404/index', // OPTIONAL: relative to viewsDir above
});

// set up engine
app.engine('js', engine);

// use engine
app.set('view engine', 'js');

// set directory where all index.js pages are served
app.set('views', viewsDir);

// render HTML in public/homepage.js with data
app.get('/', function (req, res, next) {
  renderView('homepage', req, res, {
    title: 'Awesome Homepage',
    name: 'Bob',
  });
});

// OPTIONALLY: route all GET requests to directories
// to their associated static index.js views in the public directory
// and, if not found, route to the 404/index.js view
app.use(staticIndexHandler());
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

## Advanced usage

### Injecting and using state based on a request

The following shows an example of showing a logged out state based on the cookie on a request.

```js
import htmlExpress, { renderView } from 'html-express-js';

const app = express();
const __dirname = resolve();

const viewsDir = `${__dirname}/public`;

const { engine, staticIndexHandler } = htmlExpress({
  viewsDir,
  /**
   * Inject global state into all views based on cookie
   */
  buildRequestState: (req) => {
    if (req.cookies['authed']) {
      return {
        loggedIn: true,
      };
    }
  },
});

app.engine('js', engine);
app.set('view engine', 'js');
app.set('views', viewsDir);

app.get('/', function (req, res, next) {
  renderView('homepage', req, res);
});
```

```js
// public/homepage.js
import { html } from 'html-express-js';

export const view = (data, state) => {
  const { loggedIn } = state;

  return html`
    <!doctype html>
    <html lang="en">
      <head>
        <title>${data.title}</title>
      </head>

      <body>
        ${loggedIn ? `<a href="/logout">Logout</a>` : 'Not logged in'}
      </body>
    </html>
  `;
};
```

## Development

Run site in examples directory

```bash
npm start
```

Run tests

```bash
npm test
```
