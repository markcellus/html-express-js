/**
 * Template literal that supports string
 * interpolating in passed HTML.
 *
 * @param {*} strings
 * @param  {...any} data
 * @returns {string} - HTML string
 */
export function html(strings: any, ...data: any[]): string;
/**
 * Attempts to render index.js pages when requesting to
 * directories and fallback to 404/index.js if doesnt exist.
 *
 * @param {object} [options]
 * @param {string} options.viewsDir - The directory that houses any potential index files
 * @param {string} [options.notFoundView] - The path of a file relative to the views
 *    directory that should be served as 404 when no matching index page exists. Defaults to `404/index`.
 * @returns {import('express').RequestHandler} - Middleware function
 */
export function staticIndexHandler(options?: {
    viewsDir: string;
    notFoundView?: string;
}): import('express').RequestHandler;
/**
 * Returns a template engine view function.
 *
 * @param {object} [opts]
 * @param {string} [opts.includesDir]
 * @returns {(path: string, options: object, callback: (e: any, rendered?: string) => void) => void}
 */
export default function _default(opts?: {
    includesDir?: string;
}): (path: string, options: object, callback: (e: any, rendered?: string) => void) => void;
