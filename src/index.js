import { basename } from 'path';
import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import { promisify } from 'util';
import g from 'glob';
import decomment from 'decomment';
import he from 'he';

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
  const templateResult = view(data, state);
  const rendered = render(templateResult);
  let rawHtml = '';
  for (const chunk of rendered) {
    rawHtml += chunk;
  }
  const decommentedHTML = decomment(rawHtml); // remove extraneous lit-part syntax
  const decodedHTML = he.decode(decommentedHTML);
  return decodedHTML;
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
