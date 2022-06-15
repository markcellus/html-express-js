# lit-express

## Features

- Serves HTML documents using template literals + Lit
- Supports includes in served HTML documents

## Installation

```
npm install lit-express lit-html @lit-labs/ssr
```

## Basic Usage

The following shows at a high level how the package can be used as an Express template engine. See [example](/example) directory for all details of a working implementation.

```js
import litExpress from 'lit-express';

const app = express();
const __dirname = resolve();

// set up engine
app.engine(
  'js',
  litExpress({
    includesDir: 'includes', // where all includes reside
    notFoundView: '404', // view to render (inside public directory) when there is no index file
  })
);
// use engine
app.set('view engine', 'js');

// set directory where all index.js pages are served
app.set('views', `${__dirname}/public`);

// render HTML in public/dashboard.js with data
app.get('/', function (req, res, next) {
  res.render('dashboard', {
    name: 'Bob',
  });
});
```
