import { basename } from 'path';
import { promisify } from 'util';
import g from 'glob';

const glob = promisify(g);

/**
 * Renders an HTML template in a file.
 *
 * @private
 * @param {string} path - The path to html file
 * @param {object} [data]
 * @param {object} [state] - Page-level attributes
 * @returns {string} HTML
 */
async function renderHtmlFileTemplate(path, data, state) {
  const { view } = await import(path);
  const rendered = view(data, state);
  let html = '';
  for (const chunk of rendered) {
    html += chunk;
  }
  return html;
}

/**
 * Renders a JS HTML file and adds all includes to state object.
 *
 * @param {string} filePath - The path to html file
 * @param {object} data - Data to be made available in view
 * @param {object} options - Options passed to express
 * @returns {string} HTML with includes available (appended to state)
 */
async function renderHtmlFile(filePath, data = {}, options = {}) {
  const state = {
    includes: {},
  };
  const { includesDir } = options;

  const includeFilePaths = await glob(`${includesDir}/*.js`);
  for await (const includePath of includeFilePaths) {
    const key = basename(includePath, '.js');
    state.includes[key] = await renderHtmlFileTemplate(
      includePath,
      data,
      state
    );
  }
  return await renderHtmlFileTemplate(filePath, data, state);
}

/**
 * Template literal that supports string interpolating in passed HTML.
 * @param {*} strings
 * @param  {...any} data
 * @returns {string} - HTML string
 */
export function html(strings, ...data) {
  let rawHtml = '';
  for (const [i, str] of strings.entries()) {
    const exp = data[i] || '';
    rawHtml += str + exp;
  }
  const html = rawHtml.replace(/[\n\r]/g, '');
  return html;
}

/**
 * Returns a template engine view function.
 *
 * @param {object} [opts]
 * @param {object} [opts.includesDir]
 * @param {object} [opts.notFoundView]
 * @returns {Function}
 */
export default function (opts = {}) {
  return async (filePath, data, callback) => {
    const viewsDir = data.settings.views;
    const includePath = opts.includesDir || 'includes';

    const sanitizedOptions = {
      viewsDir,
      includesDir: `${viewsDir}/${includePath}`,
      notFoundView: opts.notFoundView
        ? `${viewsDir}/${opts.notFoundView}.js`
        : `${viewsDir}/404/index.js`,
    };

    const html = await renderHtmlFile(filePath, data, sanitizedOptions);
    return callback(null, html);
  };
}

/**
 * Attempts to render index.js pages when requesting to
 * directories and fallback to 404/index.js if doesnt exist.
 *
 * @param {object} [options]
 * @param {object} [options.basename] - The filename (w/out extension) to use for each
 *    index page in every directory. Defaults to `index`.
 * @param {object} [options.notFoundView] - The path of a file relative to the views
 *    directory that should be served as 404 when no matching index page exists. Defaults to `404/index`.
 * @returns {function} - Middleware function
 */
export function staticIndexHandler(rawOptions = {}) {
  const options = {
    basename: rawOptions.basename || 'index',
    notFoundView: rawOptions.notFoundView || '404/index',
  };
  return async function (req, res, next) {
    const { path: rawPath } = req;
    const fileExtension = extname(rawPath);
    if (fileExtension) {
      return next();
    }
    const sanitizedPath = rawPath.replace('/', ''); // remove beginning slash
    const path = sanitizedPath ? `${sanitizedPath}/index` : 'index';
    try {
      const viewsDir = req.settings.views;
      await stat(`${viewsDir}/${path}.js`); // check if file exists
      res.render(path);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      res.status(404);
      res.render(options.notFoundView);
    }
  };
}
