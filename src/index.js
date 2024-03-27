import { basename, extname } from 'path';
import { glob } from 'glob';
import { stat } from 'fs/promises';

/**
 * @callback HTMLExpressBuildStateHandler
 * @param {import('express').Request} req
 * @returns {Record<string, any>}
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
 * @param {object} options - Options passed to original instantiation
 * @param {HTMLExpressOptions['includesDir']} options.includesDir
 * @param {Record<string, any>} [options.state]
 * @returns {Promise<string>} HTML with includes available (appended to state)
 */
async function renderHtmlFile(filePath, data = {}, options) {
  const { includesDir } = options || {};
  const state = options.state || {};
  state.includes = {};

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
 * @param {HTMLExpressOptions} [options]
 * @returns {import('express').RequestHandler}
 */

/**
 * Attempts to render index.js pages when requesting to
 * directories and fallback to 404/index.js if doesnt exist.
 *
 * @type {HTMLExpressStaticIndexHandler}
 */
function staticIndexHandler(options) {
  const { viewsDir, notFoundView, includesDir, buildRequestState } = options;

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

    const requestState = buildRequestState ? buildRequestState(req) : {};

    const renderOptions = {
      includesDir,
      state: requestState,
    };
    res.setHeader('Content-Type', 'text/html');
    try {
      const absoluteFilePath = `${viewsDir}/${path}.js`;
      await stat(absoluteFilePath); // check if file exists
      const html = await renderHtmlFile(absoluteFilePath, {}, renderOptions);
      res.send(html);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
      const notFoundViewPath = notFoundView || `404/index`;
      const notFoundAbsoluteFilePath = `${viewsDir}/${notFoundViewPath}.js`;
      const html = await renderHtmlFile(
        notFoundAbsoluteFilePath,
        {},
        renderOptions,
      );
      res.status(404);
      res.send(html);
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
export default function (opts) {
  const { buildRequestState, notFoundView, viewsDir } = opts;
  const includesDir = opts.includesDir
    ? opts.includesDir
    : `${viewsDir}/includes`;
  return {
    staticIndexHandler: (options) => {
      return staticIndexHandler({
        includesDir,
        viewsDir,
        notFoundView,
        buildRequestState,
        ...options,
      });
    },
    engine: async (filePath, data, callback) => {
      const html = await renderHtmlFile(
        filePath,
        {},
        {
          includesDir,
        },
      );
      return callback(null, html);
    },
  };
}
