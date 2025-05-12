import { basename, extname } from 'path';
import { glob } from 'glob';
import { stat } from 'fs/promises';

/**
 * @callback HTMLExpressBuildStateHandler
 * @param {import('express').Request} req
 * @returns {Promise<Record<string, any>>}
 */

/**
 * @typedef {object} HTMLExpressOptions
 * @property {string} viewsDir - The directory that houses any potential index files
 * @property {string} [includesDir] - The directory that houses all of the includes
 * that will be available on the includes property of each static page.
 * @property {string} [notFoundView] - The path of a file relative to the views
 *    directory that should be served as 404 when no matching index page exists. Defaults to `404/index`.
 * @property {HTMLExpressBuildStateHandler} [buildRequestState] - A callback function that allows for
 * building a state object from request information, that will be merged with default state and made available to all views
 */

/**
 * @typedef {Record<string, string> & {
 * includes: Record<string, string>
 * }} HTMLExpressViewState
 */

/**
 * @template {Record<string, any>} [D=Record<string, any>]
 * @callback HTMLExpressView
 * @param {D} data
 * @param {HTMLExpressViewState} state
 * @returns {string}
 */

/**
 * @type {string}
 */
let includesDir = '';

/**
 * @type {string}
 */
let viewsDir = '';

/**
 * @type {HTMLExpressBuildStateHandler | undefined}
 */
let buildRequestState;

/**
 * @type {string}
 */
let notFoundView = `404/index`;

/**
 * Renders an HTML template in a file.
 *
 * @private
 * @param {string} path - The path to html file
 * @param {object} [data]
 * @param {object} [state] - Page-level attributes
 * @returns {Promise<string>} HTML
 */
async function renderFileTemplate(path, data, state) {
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
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Record<string, any>} [data]
 * @returns {Promise<void>} HTML with includes available (appended to state)
 */
export async function renderView(filePath, req, res, data = {}) {
  const requestState = buildRequestState ? await buildRequestState(req) : {};
  const html = await buildViewHtml(filePath, data, requestState);
  res.send(html);
}

/**
 * Renders a JS HTML file and adds all includes to state object.
 *
 * @param {string} filePath - The path to html file
 * @param {object} data - Data to be made available in view
 * @param {Record<string, any>} [customState]
 * @returns {Promise<string>} HTML with includes available (appended to state)
 */
async function buildViewHtml(filePath, data = {}, customState = {}) {
  /**
   * @type {Record<string, any>}
   */
  const state = { ...customState, includes: {} };

  const includeFilePaths = await glob(`${includesDir}/*.js`);
  for await (const includePath of includeFilePaths) {
    const key = basename(includePath, '.js');
    state.includes[key] = await renderFileTemplate(includePath, data, state);
  }
  return await renderFileTemplate(`${viewsDir}/${filePath}.js`, data, state);
}

/**
 * Template literal that supports string
 * interpolating in passed HTML.
 *
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
  return rawHtml;
}

/**
 * @callback HTMLExpressStaticIndexHandler
 * @returns {import('express').RequestHandler}
 */

/**
 * Attempts to render index.js pages when requesting to
 * directories and fallback to 404 view if they don't exist.
 *
 * @type {HTMLExpressStaticIndexHandler}
 */
function staticIndexHandler() {
  return async function (req, res, next) {
    const { path: rawPath } = req;
    const fileExtension = extname(rawPath);
    if (fileExtension) {
      return next();
    }
    const pathWithoutPrecedingSlash = rawPath.replace('/', ''); // remove beginning slash
    const path = pathWithoutPrecedingSlash
      ? `${pathWithoutPrecedingSlash}/index`
      : 'index';

    res.setHeader('Content-Type', 'text/html');
    try {
      await stat(`${viewsDir}/${path}.js`); // check if file exists
      await renderView(path, req, res);
    } catch (err) {
      const e = /** @type {Error & {code?: string}} */ (err);
      if (e.code !== 'ENOENT') {
        throw e;
      }
      res.status(404);
      renderView(notFoundView, req, res);
    }
  };
}

/**
 * Returns an object containing both static
 * index handler and the template engine callback.
 *
 * @param {HTMLExpressOptions} [opts]
 * @returns {{
 * staticIndexHandler: HTMLExpressStaticIndexHandler,
 * engine: Parameters<import('express').Application['engine']>[1],
 * }}
 */
export default function (
  opts = {
    viewsDir: '',
  },
) {
  notFoundView = opts.notFoundView || notFoundView;
  buildRequestState = opts.buildRequestState;
  viewsDir = opts.viewsDir;
  includesDir = opts.includesDir ? opts.includesDir : `${viewsDir}/includes`;

  return {
    staticIndexHandler,
    engine: async (filePath, data, callback) => {
      const html = await buildViewHtml(filePath, data);
      return callback(null, html);
    },
  };
}
