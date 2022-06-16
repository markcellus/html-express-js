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
 * Renders a Lit JS HTML file and adds all includes to state object.
 *
 * @param {string} filePath - The path to html file
 * @param {object} data - Data to be made available in view
 * @param {object} options - Options passed to lit express
 * @param {object} options.includesDir
 * @param {object} options.viewsDir
 * @param {object} options.notFoundView
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
 * @param {object} opts
 * @param {object} [opts.includesDir]
 * @param {object} [opts.notFoundView]
 * @returns {Function}
 */
export default function litExpress(opts) {
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
