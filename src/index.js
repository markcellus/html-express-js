import { stat } from 'fs/promises';
import { basename, extname, resolve } from 'path';
import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import { promisify } from 'util';
import g from 'glob';
import decomment from 'decomment';
import he from 'he';

const glob = promisify(g);
const __dirname = resolve();

class LitExpress {
  /**
   * Creates an instance of LitExpress.
   *
   * @param {object} options
   * @param {string} options.viewsDir - The directory where all views files reside (defaults to public directory at project root)
   * @param {string} options.includesDir - The directory where all includes files reside (defaults to app/includes)
   * @param {string} [options.notFoundView] - The 404 view to fall back to when no view exists (defaults to 404/index.js inside of viewsDir)
   */
  constructor(options = {}) {
    const viewsDir = options.viewsDir || `${__dirname}/public`;
    this.options = {
      viewsDir,
      includesDir: `${__dirname}/app/includes`,
      notFoundView: `${viewsDir}/404/index`,
      ...options,
    };
    return this;
  }

  /**
   * Renders an HTML template in a file.
   *
   * @private
   * @param {string} path - The path to html file
   * @param {object} [data]
   * @param {object} [state] - Page-level attributes
   * @returns {string} HTML
   */
  async #renderHtmlFileTemplate(path, data, state) {
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
   * @param {string} relativePath - The path to html file (without extension) relative to the viewsDir option
   * @param {object} [data]
   * @returns {string} HTML with includes available (appended to state)
   */
  async renderHtmlFile(relativePath, data = {}) {
    const state = {
      includes: {},
    };
    const { viewsDir, includesDir } = this.options;
    const filePath = `${viewsDir}/${relativePath}`;

    const includeFilePaths = await glob(`${includesDir}/*.js`);
    for await (const includePath of includeFilePaths) {
      const key = basename(includePath, '.js');
      state.includes[key] = await this.#renderHtmlFileTemplate(
        includePath,
        data,
        state
      );
    }
    return await this.#renderHtmlFileTemplate(`${filePath}.js`, data, state);
  }

  /**
   * Renders an HTML file as a response.
   */
  get renderHtmlFileResponse() {
    /**
     * @param {string} relativePath - The path to html file (without extension) relative to the viewsDir option
     * @param {Express.Response} res
     * @param {object} [data] - Data to render
     */
    return async (relativePath, res, data) => {
      const html = await this.renderHtmlFile(relativePath, data);
      const buffer = Buffer.from(html);
      res.set('Content-Type', 'text/html');
      res.send(buffer);
    };
  }

  /**
   * Returns a middleware function that ensures
   * requests on a directory respond with appropriate index files.
   * @returns {function}
   */
  get static() {
    return async (req, res, next) => {
      const { path: rawPath } = req;
      const { viewsDir, notFoundView } = this.options;
      const fileExtension = extname(rawPath);
      if (fileExtension) {
        return next();
      }
      const path = rawPath === '/' ? '/index' : `${rawPath}/index`; // deal with homepage (/) as well
      try {
        await stat(`${viewsDir}${path}.js`); // check if file exists
        await this.renderHtmlFileResponse(path, res);
      } catch (e) {
        res.status(404);
        const [, notFoundViewRelativePath] = notFoundView.split(viewsDir);
        await this.renderHtmlFileResponse(notFoundViewRelativePath, res);
      }
    };
  }
}

export default function litExpress(options = {}) {
  return new LitExpress(options);
}
