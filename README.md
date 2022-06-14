# lit-express

## Features

- Serves HTML documents using template literals + Lit
- Supports includes in served HTML documents

## Installation

```
npm install lit-express @lit-labs/ssr
```

## Basic Usage

```js
// public/custom-page.js
import { html } from 'lit';

export const view = (data) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>${data.name}'s page</title>
    </head>

    <body>
      Hello, ${data.name}!
    </body>
  </html>
`;
```

```js
import LitExpress from 'lit-express';

const app = express();
const __dirname = resolve();

const litExpress = LitExpress({
  viewsDir: `${__dirname}/public`, // where all views reside
  includesDir: `${__dirname}/includes`, // where all includes reside
  notFoundView: `${__dirname}/public/404/index.js`, // view to render when there is no index file
});

// render HTML in public/custom-page.js with data
app.get('/custom-page', async function (req, res, next) {
  await litExpress.renderHtmlFileResponse('custom-page/index', res, {
    name: 'Bob',
  });
});

// must be BEFORE any other static file middleware
app.use(litExpress.static);
```
