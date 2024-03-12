import { basename, extname } from 'path';
import { glob } from 'glob';
import { stat } from 'fs/promises';

/**
 * Renders an HTML template in a file.
 *
 * @private
 * @param {string} path - The path to html file
 * @param {object} [data]
 * @param {object} [state] - Page-level attributes
 * @returns {Promise<string>} HTML
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
 * @param {object} instanceOptions - Options passed to original instantiation
 * @returns {Promise<string>} HTML with includes available (appended to state)
 */
async function renderHtmlFile(filePath, data = {}, instanceOptions = {}) {
  const state = {
    includes: {},
  };
  const { includesDir } = instanceOptions;

  const includeFilePaths = await glob(`${includesDir}/*.js`);
  for await (const includePath of includeFilePaths) {
    const key = basename(includePath, '.js');
    state.includes[key] = await renderHtmlFileTemplate(
      includePath,
      data,
      state,
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
 * Attempts to render index.js pages when requesting to
 * directories and fallback to 404/index.js if doesnt exist.
 *
 * @param {object} [options]
 * @param {object} options.viewsDir - The directory that houses any potential index files
 * @param {string} [options.notFoundView] - The path of a file relative to the views
 *    directory that should be served as 404 when no matching index page exists. Defaults to `404/index`.
 * @returns {import('express').RequestHandler} - Middleware function
 */
export function staticIndexHandler(options) {
  const notFoundView = options.notFoundView || `404/index`;

  return async function (req, res, next) {
    const { path: rawPath } = req;
    const fileExtension = extname(rawPath);
    if (fileExtension) {
      return next();
    }
    const sanitizedPath = rawPath.replace('/', ''); // remove beginning slash
    const path = sanitizedPath ? `${sanitizedPath}/index` : 'index';
    try {
      await stat(`${options.viewsDir}/${path}.js`); // check if file exists
      res.render(path);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      res.status(404);
      res.render(notFoundView);
    }
  };
}

/**
 * Returns a template engine view function.
 *
 * @param {object} [opts]
 * @param {object} [opts.includesDir]
 * @returns {(path: string, options: object, callback: (e: any, rendered?: string) => void) => void}
 */
export default function (opts = {}) {
  return async (filePath, data, callback) => {
    const viewsDir = data.settings.views;
    const includePath = opts.includesDir || 'includes';

    const sanitizedOptions = {
      viewsDir,
      includesDir: `${viewsDir}/${includePath}`,
    };

    const html = await renderHtmlFile(filePath, data, sanitizedOptions);
    return callback(null, html);
  };
}
